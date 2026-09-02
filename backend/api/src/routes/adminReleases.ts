import { FastifyPluginAsync } from 'fastify';
import { createWriteStream } from 'node:fs';
import { mkdir, stat, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { pool } from '../db/pool.js';
import { requireAdmin } from '../plugins/auth.js';
import { config } from '../config.js';
import { compareVersions, isVersionValid } from '../lib/semver.js';

// Admin: manual list of releases.
async function listReleases() {
  const res = await pool.query(
    'SELECT id, version, file_name, file_size, notes, published, created_at, published_at FROM releases ORDER BY id DESC'
  );
  return res.rows;
}

// Notify connected desktop hosts (sync WebSocket server) about a new release.
async function notifySync(version: string, message: string) {
  try {
    const body = JSON.stringify({ version, message });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      await fetch(`${config.syncUrl}/notify/update`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    console.error('notifySync failed:', err);
  }
}

const adminReleasesRoutes: FastifyPluginAsync = async (app) => {
  // List releases.
  app.get('/releases', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;
    return reply.send({ ok: true, releases: await listReleases() });
  });

  // Upload a new installer (multipart: version, notes?, file).
  app.post('/releases', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;

    // Consume every part in stream order so non-file fields (e.g. notes) are
    // captured regardless of whether they appear before or after the file.
    // The file stream must be drained to let iteration advance to later parts,
    // so we stream it into a temp file and finalize it only after validation.
    let version = '';
    let notes = '';
    let filename = '';
    const tmpName = `LiveSession_Setup_tmp_${randomBytes(6).toString('hex')}`;
    const tmpPath = path.join(config.downloadsDir, tmpName);

    try {
      await mkdir(config.downloadsDir, { recursive: true });
      for await (const part of request.parts()) {
        if (part.type === 'file') {
          filename = part.filename || '';
          await pipeline(part.file, createWriteStream(tmpPath));
        } else if (part.fieldname === 'version') {
          version = String(part.value ?? '').trim();
        } else if (part.fieldname === 'notes') {
          notes = String(part.value ?? '').trim();
        }
      }
    } catch (err) {
      console.error('read multipart upload failed:', err);
      return reply.code(400).send({ ok: false, error: 'UPLOAD_FAILED', message: 'Failed to read upload' });
    }

    const fileExists = await stat(tmpPath).then(() => true, () => false);
    try {
      if (!fileExists) {
        return reply.code(400).send({ ok: false, error: 'VALIDATION', message: 'multipart file required' });
      }
      if (!version || !isVersionValid(version)) {
        return reply.code(400).send({ ok: false, error: 'VALIDATION', message: 'version (x.y[.z]) required' });
      }
      const ext = path.extname(filename).toLowerCase();
      if (ext !== '.exe') {
        return reply.code(400).send({ ok: false, error: 'VALIDATION', message: 'only .exe installers are allowed' });
      }

      // Enforce that the new version is newer than the latest recorded release.
      const existing = await pool.query('SELECT version FROM releases ORDER BY id DESC LIMIT 1');
      if ((existing.rowCount ?? 0) > 0 && compareVersions(version, existing.rows[0].version) <= 0) {
        return reply.code(409).send({
          ok: false,
          error: 'VERSION_NOT_NEWER',
          message: `Version ${version} is not newer than latest ${existing.rows[0].version}`,
        });
      }

      // Preserve an .exe suffix for sane download filenames, then finalize the upload.
      const storedName = `LiveSession_Setup_${version}.exe`;
      const filePath = path.join(config.downloadsDir, storedName);
      await rename(tmpPath, filePath);

      const info = await stat(filePath);

      await pool.query(
        `INSERT INTO releases (version, file_name, file_size, notes) VALUES ($1, $2, $3, $4)
         ON CONFLICT (version) DO UPDATE SET file_name = EXCLUDED.file_name,
           file_size = EXCLUDED.file_size, notes = EXCLUDED.notes, published = false,
           published_at = NULL`,
        [version, storedName, info.size, notes || null]
      );

      return reply.send({ ok: true, releases: await listReleases() });
    } catch (err) {
      console.error('process upload failed:', err);
      return reply.code(500).send({ ok: false, error: 'DB_FAILED' });
    } finally {
      if (await stat(tmpPath).then(() => true, () => false)) {
        await unlink(tmpPath).catch(() => {});
      }
    }
  });

  // Publish a release: mark as published and push a WS notification to clients.
  app.post<{ Params: { id: string } }>('/releases/:id/publish', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;

    const id = Number(request.params.id);
    const res = await pool.query(
      `UPDATE releases SET published = true, published_at = now()
       WHERE id = $1 AND published = false
       RETURNING id, version, notes`,
      [id]
    );
    if (res.rowCount === 0) {
      return reply.code(404).send({ ok: false, error: 'NOT_FOUND', message: 'release not found or already published' });
    }
    const release = res.rows[0];
    await notifySync(release.version, release.notes || '');
    return reply.send({ ok: true, releases: await listReleases() });
  });
};

export default adminReleasesRoutes;
