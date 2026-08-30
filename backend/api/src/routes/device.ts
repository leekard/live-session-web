import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { randomBytes } from 'node:crypto';
import { pool } from '../db/pool.js';
import { config } from '../config.js';
import { requireUser } from '../plugins/auth.js';

const deviceRoutes: FastifyPluginAsync = async (app) => {
  // Desktop: start browser login. Returns a code + a login URL for the browser.
  app.post('/device/login', async (request: FastifyRequest<{ Body: { deviceId?: string; deviceName?: string } }>, reply) => {
    const deviceId = request.body?.deviceId;
    if (!deviceId) return reply.code(400).send({ ok: false, error: 'VALIDATION', message: 'deviceId required' });
    // Clean up any previously pending codes for this device.
    await pool.query('UPDATE device_codes SET status = $1 WHERE device_id = $2 AND status = $3', ['expired', deviceId, 'pending']);

    const code = randomBytes(6).toString('hex').toLowerCase();
    const expiresAt = new Date(Date.now() + config.deviceCodeTtlMs);
    await pool.query(
      'INSERT INTO device_codes (code, device_id, status, expires_at) VALUES ($1, $2, $3, $4)',
      [code, deviceId, 'pending', expiresAt]
    );

    const loginUrl = `${config.webOrigin}/device/login?code=${code}`;
    return reply.send({ ok: true, deviceCode: code, loginUrl, expiresIn: config.deviceCodeTtlMs / 1000 });
  });

  // Browser: confirm/deny the code after the user logs in.
  app.post('/device/confirm', async (request: FastifyRequest<{ Body: { code?: string; approve?: boolean } }>, reply) => {
    const code = request.body?.code;
    const approve = request.body?.approve !== false;
    if (!code) return reply.code(400).send({ ok: false, error: 'VALIDATION' });

    const user = await requireUser(request, reply);
    if (!user) return;

    const res = await pool.query(
      'SELECT * FROM device_codes WHERE code = $1',
      [code]
    );
    if (res.rowCount === 0) return reply.code(404).send({ ok: false, error: 'CODE_NOT_FOUND' });
    const row = res.rows[0];
    if (row.status !== 'pending') return reply.code(409).send({ ok: false, error: 'CODE_EXPIRED' });
    if (new Date(row.expires_at).getTime() < Date.now()) {
      await pool.query('UPDATE device_codes SET status = $1 WHERE code = $2', ['expired', code]);
      return reply.code(410).send({ ok: false, error: 'CODE_EXPIRED' });
    }

    await pool.query(
      'UPDATE device_codes SET status = $1, user_id = $2 WHERE code = $3',
      [approve ? 'approved' : 'expired', approve ? user.id : null, code]
    );

    return reply.send({ ok: true, status: approve ? 'approved' : 'denied' });
  });

  // Desktop: poll for the login result. Returns an access token when approved.
  app.post('/device/poll', async (request: FastifyRequest<{ Body: { code?: string; deviceId?: string } }>, reply) => {
    const code = request.body?.code;
    if (!code) return reply.code(400).send({ ok: false, error: 'VALIDATION' });

    const res = await pool.query('SELECT * FROM device_codes WHERE code = $1', [code]);
    if (res.rowCount === 0) return reply.code(404).send({ ok: false, error: 'CODE_NOT_FOUND' });
    const row = res.rows[0];

    if (row.status === 'pending') {
      // Expire if stale.
      if (new Date(row.expires_at).getTime() < Date.now()) {
        await pool.query('UPDATE device_codes SET status = $1 WHERE code = $2', ['expired', code]);
        return reply.send({ ok: false, status: 'expired' });
      }
      return reply.send({ ok: false, status: 'pending' });
    }
    if (row.status === 'approved' && row.user_id) {
      const userRes = await pool.query('SELECT id, email, role FROM users WHERE id = $1', [row.user_id]);
      const user = userRes.rows[0];
      if (!user) return reply.code(401).send({ ok: false, error: 'UNAUTHORIZED' });
      // Issue a device-scoped token with subject = 'dev:<deviceId>:<userId>'.
      const token = app.jwt.sign({ sub: `dev:${row.device_id}:${user.id}`, role: user.role }, { expiresIn: '7d' });
      return reply.send({ ok: true, status: 'approved', token, user: { id: user.id, email: user.email, role: user.role } });
    }
    // denied/expired
    return reply.send({ ok: false, status: row.status });
  });
};

export default deviceRoutes;
