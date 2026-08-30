import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { randomBytes } from 'node:crypto';
import { pool } from '../db/pool.js';
import { config } from '../config.js';
import { requireUser } from '../plugins/auth.js';
import { identify, userPlan, enforceDeviceLimit } from './identity.js';

/**
 * Register (upsert) a device for a user, copying the display name from the
 * pending code. Returns the token_version of the device.
 */
async function registerDevice(userId: number, deviceId: string, name: string | null): Promise<number> {
  const res = await pool.query(
    `INSERT INTO devices (user_id, device_id, name, status, token_version)
     VALUES ($1, $2, $3, 'active', 0)
     ON CONFLICT (user_id, device_id)
     DO UPDATE SET name = COALESCE(EXCLUDED.name, devices.name), status = 'active'
     RETURNING token_version`,
    [userId, deviceId, name]
  );
  return res.rows[0].token_version as number;
}

const deviceRoutes: FastifyPluginAsync = async (app) => {
  // Desktop: start browser login. Returns a code + a login URL for the browser.
  app.post('/device/login', async (request: FastifyRequest<{ Body: { deviceId?: string; deviceName?: string } }>, reply) => {
    const deviceId = request.body?.deviceId;
    if (!deviceId) return reply.code(400).send({ ok: false, error: 'VALIDATION', message: 'deviceId required' });
    const deviceName = request.body?.deviceName || null;
    // Clean up any previously pending codes for this device.
    await pool.query('UPDATE device_codes SET status = $1 WHERE device_id = $2 AND status = $3', ['expired', deviceId, 'pending']);

    const code = randomBytes(6).toString('hex').toLowerCase();
    const expiresAt = new Date(Date.now() + config.deviceCodeTtlMs);
    await pool.query(
      'INSERT INTO device_codes (code, device_id, name, status, expires_at) VALUES ($1, $2, $3, $4, $5)',
      [code, deviceId, deviceName, 'pending', expiresAt]
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

    if (approve) {
      // Enforce per-plan active device limit before approving.
      const plan = await userPlan(user.id);
      const limit = await enforceDeviceLimit(user.id, plan, { excludeDeviceId: row.device_id });
      if (!limit.ok) {
        await pool.query('UPDATE device_codes SET status = $1 WHERE code = $2', ['denied', code]);
        return reply.code(409).send({ ok: false, error: 'DEVICE_LIMIT', message: 'Active device limit reached for this plan' });
      }
      await registerDevice(user.id, row.device_id, row.name);
      await pool.query(
        'UPDATE device_codes SET status = $1, user_id = $2 WHERE code = $3',
        ['approved', user.id, code]
      );
    } else {
      await pool.query(
        'UPDATE device_codes SET status = $1, user_id = $2 WHERE code = $3',
        ['expired', null, code]
      );
    }

    return reply.send({ ok: true, status: approve ? 'approved' : 'denied' });
  });

  // Desktop: poll for the login result. Returns a token when approved.
  app.post('/device/poll', async (request: FastifyRequest<{ Body: { code?: string } }>, reply) => {
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
      const devRes = await pool.query(
        'SELECT token_version FROM devices WHERE user_id = $1 AND device_id = $2',
        [user.id, row.device_id]
      );
      const tokenVersion = devRes.rowCount ? devRes.rows[0].token_version : 0;
      // Long-lived device token. It only becomes invalid via explicit revocation
      // (token_version bump / status change), never by time alone.
      const token = app.jwt.sign(
        { sub: `dev:${row.device_id}:${user.id}:${tokenVersion}`, role: user.role },
        { expiresIn: '365d' }
      );
      return reply.send({ ok: true, status: 'approved', token, user: { id: user.id, email: user.email, role: user.role } });
    }
    // denied/expired
    return reply.send({ ok: false, status: row.status });
  });

  // Desktop: report activity (updates last_seen_at).
  app.post('/device/heartbeat', async (request, reply) => {
    const identity = await identify(request, reply);
    if (!identity || !identity.deviceId) return reply.code(401).send({ ok: false, error: 'UNAUTHORIZED' });
    await pool.query(
      'UPDATE devices SET last_seen_at = now() WHERE user_id = $1 AND device_id = $2',
      [identity.id, identity.deviceId]
    );
    return reply.send({ ok: true });
  });

  // Desktop: current profile bound to the device.
  app.get('/device/me', async (request, reply) => {
    const identity = await identify(request, reply);
    if (!identity || !identity.deviceId) return reply.code(401).send({ ok: false, error: 'UNAUTHORIZED' });
    const res = await pool.query(
      `SELECT d.*, u.email, u.role FROM devices d
       JOIN users u ON u.id = d.user_id
       WHERE d.user_id = $1 AND d.device_id = $2`,
      [identity.id, identity.deviceId]
    );
    if (res.rowCount === 0) return reply.code(404).send({ ok: false, error: 'DEVICE_NOT_FOUND' });
    const d = res.rows[0];
    return reply.send({
      ok: true,
      user: { id: identity.id, email: d.email, role: d.role },
      device: { deviceId: d.device_id, name: d.name, status: d.status, lastSeenAt: d.last_seen_at, createdAt: d.created_at },
    });
  });

  // Desktop: the license currently activated on this device.
  app.get('/device/licenses', async (request, reply) => {
    const identity = await identify(request, reply);
    if (!identity || !identity.deviceId) return reply.code(401).send({ ok: false, error: 'UNAUTHORIZED' });
    const res = await pool.query(
      `SELECT l.*, u.email FROM licenses l
       JOIN users u ON u.id = l.user_id
       WHERE l.device_id = $1 AND l.user_id = $2
       ORDER BY l.id DESC`,
      [identity.deviceId, identity.id]
    );
    return reply.send({
      ok: true,
      licenses: res.rows.map((l) => ({
        id: l.id,
        plan: l.plan,
        status: l.status,
        licenseKey: l.license_key,
        activatedAt: l.activated_at,
        expiresAt: l.expires_at,
        account: l.email,
      })),
    });
  });

  // Desktop: auto-bind the account's active license to this device (no key).
  // The license is account-bound; the desktop simply claims it for this device
  // as long as the per-plan active device limit has not been reached.
  app.post('/device/activate', async (request, reply) => {
    const identity = await identify(request, reply);
    if (!identity || !identity.deviceId) return reply.code(401).send({ ok: false, error: 'UNAUTHORIZED' });

    // Latest active (not revoked/expired) license belonging to this account.
    const licRes = await pool.query(
      `SELECT * FROM licenses
       WHERE user_id = $1 AND status = 'active' AND (expires_at IS NULL OR expires_at > now())
       ORDER BY id DESC LIMIT 1`,
      [identity.id]
    );
    if (licRes.rowCount === 0) {
      return reply.code(404).send({ ok: false, error: 'NO_LICENSE', message: 'No active license on this account' });
    }
    const lic = licRes.rows[0];

    if (lic.device_id && lic.device_id === identity.deviceId) {
      // Already active on this device.
      return reply.send({ ok: true, activated: false, license: { id: lic.id, plan: lic.plan, status: lic.status, expiresAt: lic.expires_at } });
    }
    if (lic.device_id && lic.device_id !== identity.deviceId) {
      return reply.code(409).send({ ok: false, error: 'DEVICE_CONFLICT', message: 'License already activated on another device' });
    }

    // Enforce per-plan active device limit.
    const limit = await enforceDeviceLimit(identity.id, lic.plan, { excludeDeviceId: identity.deviceId });
    if (!limit.ok) {
      return reply.code(409).send({ ok: false, error: 'DEVICE_LIMIT', message: 'Active device limit reached for this plan' });
    }

    await pool.query(
      'UPDATE licenses SET device_id = $1, activated_at = now(), status = $2 WHERE id = $3',
      [identity.deviceId, 'active', lic.id]
    );

    return reply.send({
      ok: true,
      activated: true,
      license: { id: lic.id, plan: lic.plan, status: 'active', expiresAt: lic.expires_at },
    });
  });
};

export default deviceRoutes;
