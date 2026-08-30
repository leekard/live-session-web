import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { pool } from '../db/pool.js';
import { config } from '../config.js';

declare module 'fastify' {
  interface FastifyInstance {
    getAuthUser(request: FastifyRequest): Promise<{ id: number; role: string } | null>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; role: string };
    user: { sub: string; role: string };
  }
}

export interface AuthedUser {
  id: number;
  email: string;
  role: string;
}

const authPlugin: FastifyPluginAsync = async (app) => {
  await app.register(cookie);
  await app.register(jwt, {
    secret: config.jwtSecret,
    cookie: { cookieName: config.cookieName, signed: false },
    verify: {
      extractToken: (request) => {
        const header = request.headers['x-auth-token'];
        if (typeof header === 'string' && header.length > 0) return header;
        const cookieToken = (request as FastifyRequest).cookies?.[config.cookieName];
        return cookieToken || undefined;
      },
    },
  });

  app.decorate('getAuthUser', async (request: FastifyRequest): Promise<{ id: number; role: string } | null> => {
    try {
      const payload = await request.jwtVerify<{ sub: string; role: string }>();
      const id = Number(payload.sub);
      if (!Number.isInteger(id) || id <= 0) return null;
      return { id, role: payload.role };
    } catch {
      return null;
    }
  });
};

export default fp(authPlugin);

// ---- Route helpers ---------------------------------------------------------

export async function requireUser(request: FastifyRequest, reply: FastifyReply): Promise<AuthedUser | null> {
  const auth = await (request.server.getAuthUser)(request);
  if (!auth) {
    reply.code(401).send({ ok: false, error: 'UNAUTHORIZED' });
    return null;
  }
  const res = await pool.query('SELECT id, email, role FROM users WHERE id = $1', [auth.id]);
  if (res.rowCount === 0) {
    reply.code(401).send({ ok: false, error: 'UNAUTHORIZED' });
    return null;
  }
  return res.rows[0] as AuthedUser;
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<AuthedUser | null> {
  const user = await requireUser(request, reply);
  if (!user) return null;
  if (user.role !== 'admin') {
    reply.code(403).send({ ok: false, error: 'FORBIDDEN' });
    return null;
  }
  return user;
}
