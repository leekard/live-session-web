import { beforeAll, afterAll, describe, expect, it } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/server.js';
import { pool } from '../src/db/pool.js';
import { runMigrations } from '../src/db/migrate.js';

let app: FastifyInstance;

async function resetDb() {
  await pool.query('TRUNCATE device_codes, licenses, orders, users RESTART IDENTITY CASCADE');
}

beforeAll(async () => {
  await runMigrations();
  await resetDb();
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await pool.end();
});

describe('auth', () => {
  it('registers a user and logs in', async () => {
    const reg = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'user@test.com', password: 'secret123' },
    });
    expect(reg.statusCode).toBe(201);
    const body = reg.json();
    expect(body.ok).toBe(true);
    expect(body.user.email).toBe('user@test.com');
    expect(reg.headers['set-cookie']).toBeDefined();

    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'user@test.com', password: 'secret123' },
    });
    expect(login.statusCode).toBe(200);
    expect(login.json().ok).toBe(true);
  });

  it('rejects bad credentials', async () => {
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'user@test.com', password: 'wrongpass' },
    });
    expect(login.statusCode).toBe(401);
  });
});

describe('device login flow', () => {
  it('creates, approves via cookie, and polls to get a token', async () => {
    // register the user first
    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'dev@test.com', password: 'secret123' },
    });

    // desktop creates a code
    const start = await app.inject({
      method: 'POST',
      url: '/api/auth/device/login',
      payload: { deviceId: 'DEVICE-1' },
    });
    expect(start.statusCode).toBe(200);
    const { deviceCode, loginUrl } = start.json();
    expect(deviceCode).toBeDefined();
    expect(loginUrl).toContain(deviceCode);

    // poll while pending
    const pending = await app.inject({
      method: 'POST',
      url: '/api/auth/device/poll',
      payload: { code: deviceCode },
    });
    expect(pending.json().status).toBe('pending');

    // user logs in (cookie) and approves
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'dev@test.com', password: 'secret123' },
    });
    const cookie = String(login.headers["set-cookie"] ?? "").split(";")[0];
    const approve = await app.inject({
      method: 'POST',
      url: '/api/auth/device/confirm',
      headers: { cookie },
      payload: { code: deviceCode, approve: true },
    });
    expect(approve.json().ok).toBe(true);

    // desktop polls -> token
    const poll = await app.inject({
      method: 'POST',
      url: '/api/auth/device/poll',
      payload: { code: deviceCode },
    });
    const pollBody = poll.json();
    expect(pollBody.status).toBe('approved');
    expect(pollBody.token).toBeDefined();
  });
});

describe('licenses', () => {
  it('creates an order+license, activates and validates on a device', async () => {
    const reg = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'lic@test.com', password: 'secret123' },
    });
    const cookie = String(reg.headers["set-cookie"] ?? "").split(";")[0];

    // create an order -> issues a license
    const order = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: { cookie },
      payload: { plan: 'pro' },
    });
    expect(order.statusCode).toBe(201);
    const license = order.json().license;
    expect(license.license_key).toBeDefined();

    // activate on a device (bearer token path)
    // get device token by doing a device login
    const start = await app.inject({
      method: 'POST',
      url: '/api/auth/device/login',
      payload: { deviceId: 'LIC-DEVICE' },
    });
    const code = start.json().deviceCode;
    const approve = await app.inject({
      method: 'POST',
      url: '/api/auth/device/confirm',
      headers: { cookie },
      payload: { code, approve: true },
    });
    expect(approve.json().ok).toBe(true);
    const poll = await app.inject({
      method: 'POST',
      url: '/api/auth/device/poll',
      payload: { code },
    });
    const token = poll.json().token;

    const activate = await app.inject({
      method: 'POST',
      url: '/api/licenses/activate',
      headers: { authorization: `Bearer ${token}` },
      payload: { licenseKey: license.license_key, deviceId: 'LIC-DEVICE' },
    });
    expect(activate.statusCode).toBe(200);
    expect(activate.json().ok).toBe(true);

    const validate = await app.inject({
      method: 'POST',
      url: '/api/licenses/validate',
      headers: { authorization: `Bearer ${token}` },
      payload: { deviceId: 'LIC-DEVICE' },
    });
    expect(validate.json().valid).toBe(true);
  });
});
