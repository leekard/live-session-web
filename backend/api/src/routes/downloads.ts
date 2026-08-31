import { FastifyPluginAsync } from 'fastify';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { pool } from '../db/pool.js';
import { config } from '../config.js';

// Serves a recorded installer binary from the downloads volume. The file name
// is validated against the releases table to keep the route path-traversal safe.
const downloadsRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Params: { fileName: string } }>('/downloads/:fileName', async (request, reply) => {
    const { fileName } = request.params;
    if (fileName.includes('/') || fileName.includes('\\') || fileName.includes('..')) {
      return reply.code(400).send({ ok: false, error: 'INVALID_FILENAME' });
    }

    const res = await pool.query('SELECT file_name, file_size FROM releases WHERE file_name = $1 LIMIT 1', [fileName]);
    if (res.rowCount === 0) {
      return reply.code(404).send({ ok: false, error: 'NOT_FOUND' });
    }

    const filePath = path.join(config.downloadsDir, fileName);
    let info;
    try {
      info = await stat(filePath);
    } catch {
      return reply.code(404).send({ ok: false, error: 'NOT_FOUND' });
    }
    if (!info.isFile()) {
      return reply.code(404).send({ ok: false, error: 'NOT_FOUND' });
    }

    reply.header('Content-Type', 'application/octet-stream');
    reply.header('Content-Disposition', `attachment; filename="${fileName}"`);
    reply.header('Content-Length', String(info.size));
    return reply.send(createReadStream(filePath));
  });
};

export default downloadsRoutes;
