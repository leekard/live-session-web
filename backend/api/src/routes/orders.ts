import { FastifyPluginAsync } from 'fastify';
import { randomBytes } from 'node:crypto';
import { pool } from '../db/pool.js';
import { requireUser, requireAdmin } from '../plugins/auth.js';

const plans: Record<string, { amount: string; currency: string }> = {
  basic: { amount: '2900.00', currency: 'RUB' },
  pro: { amount: '5900.00', currency: 'RUB' },
  team: { amount: '14900.00', currency: 'RUB' },
  free: { amount: '0.00', currency: 'RUB' },
};

const ordersRoutes: FastifyPluginAsync = async (app) => {
  // Current user's orders.
  app.get('/me', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const res = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY id DESC', [user.id]);
    return reply.send({ ok: true, orders: res.rows });
  });

  // Create an order (payment mock) and issue a paid license immediately.
  app.post<{ Body: { plan?: string } }>('/', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const plan = request.body?.plan || 'free';
    const price = plans[plan];
    if (!price) return reply.code(400).send({ ok: false, error: 'VALIDATION', message: 'unsupported plan' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const order = await client.query(
        'INSERT INTO orders (user_id, plan, amount, currency, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [user.id, plan, price.amount, price.currency, 'paid']
      );

      const licenseKey = 'LS-' + randomBytes(6).toString('hex').toUpperCase();
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      const license = await client.query(
        'INSERT INTO licenses (user_id, plan, status, license_key, expires_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [user.id, plan, 'active', licenseKey, expiresAt]
      );

      await client.query('COMMIT');
      client.release();
      return reply.code(201).send({ ok: true, order: order.rows[0], license: license.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      client.release();
      throw err;
    }
  });

  // Admin dashboard stats.
  app.get('/stats', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;
    const users = await pool.query('SELECT count(*)::int AS total FROM users');
    const licenses = await pool.query(`SELECT status, count(*)::int AS n FROM licenses GROUP BY status`);
    const licByPlan = await pool.query(`SELECT plan, count(*)::int AS n FROM licenses GROUP BY plan`);
    const revenue = await pool.query(`SELECT coalesce(sum(amount),0)::float AS total FROM orders WHERE status = 'paid'`);
    return reply.send({
      ok: true,
      stats: {
        users: users.rows[0].total,
        licensesByStatus: Object.fromEntries(licenses.rows.map((r: { status: string; n: number }) => [r.status, r.n])),
        licensesByPlan: Object.fromEntries(licByPlan.rows.map((r: { plan: string; n: number }) => [r.plan, r.n])),
        revenue: revenue.rows[0].total,
      },
    });
  });

  // Admin: all orders.
  app.get('/', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;
    const res = await pool.query(
      `SELECT o.*, u.email FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.id DESC`
    );
    return reply.send({ ok: true, orders: res.rows });
  });
};

// Minimal transaction helper on the pool.
export default ordersRoutes;
