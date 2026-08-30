import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { pool } from '../db/pool.js';
import { requireUser } from '../plugins/auth.js';

const devicesRoutes: FastifyPluginAsync = async (app) => {
  // Browser (authed account): list the user's devices with their bound license.
  app.get('/', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const res = await pool.query(
      `SELECT
         d.device_id, d.name, d.status, d.last_seen_at, d.created_at,
         l.plan AS license_plan, l.status AS license_status, l.activated_at AS license_activated_at
       FROM devices d
       LEFT JOIN licenses l ON l.device_id = d.device_id AND l.user_id = d.user_id
       WHERE d.user_id = $1
       ORDER BY d.created_at DESC`,
      [user.id]
    );
    return reply.send({
      ok: true,
      devices: res.rows.map((d) => ({
        deviceId: d.device_id,
        name: d.name,
        status: d.status,
        lastSeenAt: d.last_seen_at,
        createdAt: d.created_at,
        license: d.license_plan
          ? { plan: d.license_plan, status: d.license_status, activatedAt: d.license_activated_at }
          : null,
      })),
    });
  });

  // Browser (authed account): revoke a device (log it out remotely).
  app.delete<{ Params: { deviceId: string } }>('/:deviceId', async (request: FastifyRequest<{ Params: { deviceId: string } }>, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const deviceId = request.params.deviceId;

    const res = await pool.query(
      'SELECT 1 FROM devices WHERE user_id = $1 AND device_id = $2',
      [user.id, deviceId]
    );
    if (res.rowCount === 0) return reply.code(404).send({ ok: false, error: 'DEVICE_NOT_FOUND' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Invalidate all previously issued tokens for this device immediately.
      await client.query(
        'UPDATE devices SET status = $1, token_version = token_version + 1 WHERE user_id = $2 AND device_id = $3',
        ['revoked', user.id, deviceId]
      );
      // Unbind any license activated on this device.
      await client.query(
        'UPDATE licenses SET device_id = NULL, activated_at = NULL WHERE user_id = $1 AND device_id = $2',
        [user.id, deviceId]
      );
      // Expire remaining device codes for this device.
      await client.query(
        "UPDATE device_codes SET status = 'expired' WHERE device_id = $1 AND status IN ('pending','approved')",
        [deviceId]
      );
      await client.query('COMMIT');
      client.release();
    } catch (err) {
      await client.query('ROLLBACK');
      client.release();
      throw err;
    }
    return reply.send({ ok: true });
  });
};

export default devicesRoutes;
