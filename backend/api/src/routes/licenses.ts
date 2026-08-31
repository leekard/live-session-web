import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { randomBytes } from 'node:crypto';
import { pool } from '../db/pool.js';
import { requireUser, requireAdmin } from '../plugins/auth.js';
import { identify, enforceDeviceLimit } from './identity.js';

const licensesRoutes: FastifyPluginAsync = async (app) => {
  // Desktop: activate a license key bound to a device.
  app.post<{ Body: { licenseKey?: string; deviceId?: string } }>('/activate', async (request, reply) => {
    const identity = await identify(request, reply);
    if (!identity) return reply.code(401).send({ ok: false, error: 'UNAUTHORIZED' });
    const { licenseKey, deviceId } = request.body || {};
    const devId = identity.deviceId || deviceId;
    if (!licenseKey || !devId) return reply.code(400).send({ ok: false, error: 'VALIDATION', message: 'licenseKey and deviceId required' });

    const res = await pool.query(
      'SELECT * FROM licenses WHERE license_key = $1',
      [licenseKey]
    );
    if (res.rowCount === 0) return reply.code(404).send({ ok: false, error: 'LICENSE_NOT_FOUND' });
    const lic = res.rows[0];

    // Ownership: license must belong to this user (admin may manage all).
    if (identity.role !== 'admin' && Number(lic.user_id) !== identity.id) {
      return reply.code(403).send({ ok: false, error: 'FORBIDDEN', message: 'License does not belong to this user' });
    }
    if (lic.status === 'revoked') return reply.code(403).send({ ok: false, error: 'LICENSE_REVOKED' });
    if (lic.expires_at && new Date(lic.expires_at).getTime() < Date.now()) return reply.code(410).send({ ok: false, error: 'LICENSE_EXPIRED' });

    // Already activated on another device?
    if (lic.device_id && lic.device_id !== devId) {
      return reply.code(409).send({ ok: false, error: 'DEVICE_CONFLICT', message: 'License already activated on another device' });
    }

    // Enforce per-plan active device limit.
    const limit = await enforceDeviceLimit(identity.id, lic.plan, { excludeDeviceId: devId });
    if (!limit.ok) {
      return reply.code(409).send({ ok: false, error: 'DEVICE_LIMIT', message: 'Active device limit reached for this plan' });
    }

    await pool.query(
      'UPDATE licenses SET device_id = $1, activated_at = now(), status = $2 WHERE id = $3',
      [devId, 'active', lic.id]
    );

    return reply.send({
      ok: true,
      license: { id: lic.id, plan: lic.plan, status: 'active', licenseKey: lic.license_key, deviceId: devId, expiresAt: lic.expires_at },
    });
  });

  // Desktop: validate the current device's license.
  app.post('/validate', async (request: FastifyRequest<{ Body: { deviceId?: string } }>, reply) => {
    const identity = await identify(request, reply);
    if (!identity) return reply.code(401).send({ ok: false, error: 'UNAUTHORIZED' });
    const devId = identity.deviceId || request.body?.deviceId;
    if (!devId) return reply.code(400).send({ ok: false, error: 'VALIDATION', message: 'deviceId required' });

    const res = await pool.query(
      `SELECT l.*, u.email FROM licenses l
       JOIN users u ON u.id = l.user_id
       WHERE l.device_id = $1 AND l.user_id = $2 AND l.status = 'active'
       ORDER BY l.id DESC LIMIT 1`,
      [devId, identity.id]
    );
    if (res.rowCount === 0) return reply.code(404).send({ ok: false, error: 'NO_LICENSE' });
    const lic = res.rows[0];
    const valid = !lic.expires_at || new Date(lic.expires_at).getTime() >= Date.now();
    return reply.send({ ok: true, valid, license: { id: lic.id, plan: lic.plan, status: lic.status, expiresAt: lic.expires_at, account: lic.email } });
  });

  // Current user's licenses (browser).
  app.get('/me', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const res = await pool.query('SELECT * FROM licenses WHERE user_id = $1 ORDER BY id DESC', [user.id]);
    return reply.send({ ok: true, licenses: res.rows });
  });

  // Admin: list all licenses.
  app.get('/', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;
    const res = await pool.query(
      `SELECT l.*, u.email FROM licenses l JOIN users u ON u.id = l.user_id ORDER BY l.id DESC`
    );
    return reply.send({ ok: true, licenses: res.rows });
  });

  // Admin: issue a license to a user.
  app.post<{ Body: { userId?: number; email?: string; plan?: string; months?: number } }>('/', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;
    const plan = request.body?.plan;
    if (!['basic', 'pro', 'team', 'founder', 'free'].includes(plan || '')) {
      return reply.code(400).send({ ok: false, error: 'VALIDATION', message: 'plan must be basic|pro|team|founder|free' });
    }

    let userId = request.body?.userId;
    if (!userId && request.body?.email) {
      const u = await pool.query('SELECT id FROM users WHERE email = $1', [request.body.email]);
      if (u.rowCount === 0) return reply.code(404).send({ ok: false, error: 'USER_NOT_FOUND' });
      userId = u.rows[0].id;
    }
    if (!userId || Number.isNaN(Number(userId))) {
      return reply.code(400).send({ ok: false, error: 'VALIDATION', message: 'userId or email required' });
    }
    const userExists = await pool.query('SELECT id FROM users WHERE id = $1', [Number(userId)]);
    if (userExists.rowCount === 0) return reply.code(404).send({ ok: false, error: 'USER_NOT_FOUND' });

    const months = request.body?.months ? Math.max(1, Math.floor(request.body.months)) : 12;
    // Founder is a lifetime plan: no expiry.
    let expiresAt: Date | null = null;
    if (plan !== 'founder') {
      expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + months);
    }
    const licenseKey = 'LS-' + randomBytes(6).toString('hex').toUpperCase();

    const res = await pool.query(
      'INSERT INTO licenses (user_id, plan, status, license_key, expires_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [Number(userId), plan, 'active', licenseKey, expiresAt]
    );
    return reply.code(201).send({ ok: true, license: res.rows[0] });
  });

  // Admin: revoke / reactivate a license.
  app.patch<{ Params: { id: string }; Body: { status?: string } }>('/:id', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;
    const id = Number(request.params.id);
    const status = request.body?.status;
    if (!['active', 'revoked', 'expired'].includes(status || '')) {
      return reply.code(400).send({ ok: false, error: 'VALIDATION', message: 'status must be active|revoked|expired' });
    }
    await pool.query('UPDATE licenses SET status = $1, device_id = NULL WHERE id = $2', [status, id]);
    return reply.send({ ok: true });
  });
};

export default licensesRoutes;
