import { FastifyReply, FastifyRequest } from 'fastify';
import { pool } from '../db/pool.js';
import { requireUser } from '../plugins/auth.js';

export interface Identity {
  id: number;
  role: string;
  deviceId?: string;
  tokenVersion?: number;
}

/**
 * A device token is valid only while the device is active AND its token_version
 * still matches the DB. Bumping token_version (on revoke) invalidates every
 * previously issued token for that device instantly. This is the ONLY way a
 * desktop session is dropped — there is no automatic time-based expiry that
 * could log a user out without an explicit action.
 */
async function verifyDeviceToken(deviceId: string, userId: number, tokenVersion: number): Promise<boolean> {
  const res = await pool.query(
    `SELECT 1 FROM devices
     WHERE device_id = $1 AND user_id = $2 AND status = 'active' AND token_version = $3`,
    [deviceId, userId, tokenVersion]
  );
  return (res.rowCount ?? 0) > 0;
}

/**
 * Resolve the caller identity:
 *  - Browser: JWT in cookie via requireUser -> { id }.
 *  - Desktop: Bearer token with subject "dev:<deviceId>:<userId>:<tokenVersion>".
 * Returns null (caller should reply 401) when the credentials are absent/invalid.
 */
export async function identify(request: FastifyRequest, reply: FastifyReply): Promise<Identity | null> {
  const authz = request.headers.authorization;
  if (authz && authz.startsWith('Bearer ')) {
    try {
      const payload = request.server.jwt.verify<{ sub: string; role: string }>(authz.slice(7));
      if (payload.sub && payload.sub.startsWith('dev:')) {
        const parts = payload.sub.split(':');
        const [, deviceId, userId, tokenVersionRaw] = parts;
        const id = Number(userId);
        if (!Number.isInteger(id)) return null;
        const tokenVersion = Number(tokenVersionRaw || 0);
        if (!(await verifyDeviceToken(deviceId, id, tokenVersion))) return null;
        return { id, deviceId, role: payload.role, tokenVersion };
      }
      return null;
    } catch {
      return null;
    }
  }

  const cookieUser = await requireUser(request, reply);
  if (cookieUser) return { id: cookieUser.id, role: cookieUser.role };
  return null;
}

/** Resolve the user's effective plan (highest active license, else 'free'). */
export async function userPlan(userId: number): Promise<string> {
  const res = await pool.query(
    `SELECT plan FROM licenses WHERE user_id = $1 AND status = 'active' ORDER BY id DESC LIMIT 1`,
    [userId]
  );
  return res.rowCount ? res.rows[0].plan : 'free';
}

/** Per-plan active device limit from plan_limits (null/0 = unlimited). */
export async function getDeviceLimit(plan: string): Promise<number | null> {
  const res = await pool.query('SELECT device_limit FROM plan_limits WHERE plan = $1', [plan]);
  if (res.rowCount === 0) return null;
  return res.rows[0].device_limit;
}

/** Number of active devices for a user (optionally excluding one device). */
export async function countActiveDevices(userId: number, excludeDeviceId?: string): Promise<number> {
  const res = await pool.query(
    `SELECT count(*)::int AS n FROM devices
     WHERE user_id = $1 AND status = 'active' AND ($2::text IS NULL OR device_id <> $2)`,
    [userId, excludeDeviceId ?? null]
  );
  return res.rows[0].n;
}

/**
 * Returns { ok: true } when the plan allows another active device,
 * otherwise { ok: false, code: 'DEVICE_LIMIT' }.
 */
export async function enforceDeviceLimit(
  userId: number,
  plan: string,
  opts?: { excludeDeviceId?: string }
): Promise<{ ok: boolean; code?: string }> {
  const limit = await getDeviceLimit(plan);
  if (limit === null || limit === 0) return { ok: true }; // 0 = unlimited
  const devices = await countActiveDevices(userId, opts?.excludeDeviceId);
  if (devices >= limit) return { ok: false, code: 'DEVICE_LIMIT' };
  return { ok: true };
}
