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
};

export default adminRoutes;
