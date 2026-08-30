import { FastifyPluginAsync } from 'fastify';
import { pool } from '../db/pool.js';
import { requireAdmin } from '../plugins/auth.js';

const adminRoutes: FastifyPluginAsync = async (app) => {
  // List users.
  app.get('/users', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;
    const res = await pool.query('SELECT id, email, role, created_at FROM users ORDER BY id DESC');
    return reply.send({ ok: true, users: res.rows });
  });

  // Change user role (assign admin).
  app.patch<{ Params: { id: string }; Body: { role?: string } }>('/users/:id', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;
    const id = Number(request.params.id);
    const role = request.body?.role;
    if (!['user', 'admin'].includes(role || '')) return reply.code(400).send({ ok: false, error: 'VALIDATION' });
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
    return reply.send({ ok: true });
  });

  // List per-plan device limits.
  app.get('/plan-limits', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;
    const res = await pool.query('SELECT plan, device_limit, updated_at FROM plan_limits ORDER BY plan');
    return reply.send({ ok: true, limits: res.rows });
  });

  // Update a plan's device limit (0 = unlimited).
  app.patch<{ Body: { plan?: string; deviceLimit?: number } }>('/plan-limits', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;
    const plan = request.body?.plan;
    const deviceLimit = request.body?.deviceLimit;
    if (!plan || typeof deviceLimit !== 'number' || !Number.isInteger(deviceLimit) || deviceLimit < 0) {
      return reply.code(400).send({ ok: false, error: 'VALIDATION', message: 'plan (string) and deviceLimit (int >= 0) required' });
    }
    const res = await pool.query(
      'UPDATE plan_limits SET device_limit = $1, updated_at = now() WHERE plan = $2 RETURNING plan, device_limit',
      [deviceLimit, plan]
    );
    if (res.rowCount === 0) return reply.code(404).send({ ok: false, error: 'PLAN_NOT_FOUND' });
    return reply.send({ ok: true, limit: res.rows[0] });
  });
};

export default adminRoutes;
