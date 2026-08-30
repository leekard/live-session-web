import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import bcrypt from 'bcryptjs';
import { pool } from '../db/pool.js';
import { config } from '../config.js';
import { requireUser, AuthedUser } from '../plugins/auth.js';

function setAuthCookie(reply: FastifyReply, token: string) {
  reply.setCookie(config.cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: false, // no TLS yet
    maxAge: 7 * 24 * 60 * 60,
  });
}

const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/register', async (request: FastifyRequest<{ Body: { email?: string; password?: string; name?: string } }>, reply) => {
    const { email, password } = request.body || {};
    if (!email || !password || !email.includes('@') || password.length < 6) {
      return reply.code(400).send({ ok: false, error: 'VALIDATION', message: 'Invalid email or password (min 6 chars)' });
    }
    const hash = bcrypt.hashSync(password, 10);
    try {
      const res = await pool.query(
        'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
        [email.toLowerCase().trim(), hash, 'user']
      );
      const user = res.rows[0];
      const token = app.jwt.sign({ sub: String(user.id), role: user.role });
      setAuthCookie(reply, token);
      return reply.code(201).send({ ok: true, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err: any) {
      if (err.code === '23505') return reply.code(409).send({ ok: false, error: 'EMAIL_TAKEN' });
      throw err;
    }
  });

  app.post('/login', async (request: FastifyRequest<{ Body: { email?: string; password?: string } }>, reply) => {
    const { email, password } = request.body || {};
    if (!email || !password) return reply.code(400).send({ ok: false, error: 'VALIDATION' });
    const res = await pool.query('SELECT id, email, password_hash, role FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (res.rowCount === 0) return reply.code(401).send({ ok: false, error: 'INVALID_CREDENTIALS' });
    const user = res.rows[0];
    if (!bcrypt.compareSync(password, user.password_hash)) return reply.code(401).send({ ok: false, error: 'INVALID_CREDENTIALS' });
    const token = app.jwt.sign({ sub: String(user.id), role: user.role });
    setAuthCookie(reply, token);
    return reply.send({ ok: true, user: { id: user.id, email: user.email, role: user.role } });
  });

  app.post('/logout', async (_request, reply) => {
    reply.clearCookie(config.cookieName, { path: '/' });
    return reply.send({ ok: true });
  });

  app.get('/me', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    return reply.send({ ok: true, user });
  });
};

export default authRoutes;
