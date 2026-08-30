import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { pool } from '../db/pool.js';
import { requireUser, requireAdmin } from '../plugins/auth.js';

/**
 * Resolve the caller identity:
 *  - Browser: JWT in cookie via requireUser -> { id }
 *  - Desktop: Bearer token with subject "dev:<deviceId>:<userId>" -> { id, deviceId }
 */
async function identify(request: FastifyRequest, reply: FastifyReply): Promise<{ id: number; deviceId?: string; role: string } | null> {
  // Try cookie auth (browser).
  const cookieUser = await requireUser(request, reply);
  if (cookieUser) return { id: cookieUser.id, role: cookieUser.role };

  // Reset reply code (requireUser may have sent 401).
  reply.code(200);

  // Try bearer (desktop).
  const authz = request.headers.authorization;
  if (authz && authz.startsWith('Bearer ')) {
    try {
      const payload = request.server.jwt.verify<{ sub: string; role: string }>(authz.slice(7));
      if (payload.sub && payload.sub.startsWith('dev:')) {
        const [, deviceId, userId] = payload.sub.split(':');
        return { id: Number(userId), deviceId, role: payload.role };
      }
      return null;
    } catch {
      return null;
    }
  }
  return null;
}

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
