import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import { config } from './config.js';
import authPlugin from './plugins/auth.js';
import authRoutes from './routes/auth.js';
import deviceRoutes from './routes/device.js';
import devicesRoutes from './routes/devices.js';
import licensesRoutes from './routes/licenses.js';
import ordersRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import adminReleasesRoutes from './routes/adminReleases.js';
import releasesRoutes from './routes/releases.js';
import downloadsRoutes from './routes/downloads.js';
import { runMigrations } from './db/migrate.js';

export async function buildApp() {
  const app = Fastify({ logger: config.mode !== 'test' });

  await app.register(authPlugin);
  await app.register(multipart, { limits: { fileSize: 1024 * 1024 * 1024 } });

  app.register(async (api) => {
    // Health
    api.get('/health', async () => ({ ok: true }));

    // Namespaced API routes
    api.register(authRoutes, { prefix: '/auth' });
    api.register(deviceRoutes, { prefix: '/auth' });
    api.register(licensesRoutes, { prefix: '/licenses' });
    api.register(devicesRoutes, { prefix: '/devices' });
    api.register(ordersRoutes, { prefix: '/orders' });
    api.register(adminRoutes, { prefix: '/admin' });
    api.register(adminReleasesRoutes, { prefix: '/admin' });
    api.register(releasesRoutes, { prefix: '/releases' });
    api.register(downloadsRoutes);
  }, { prefix: '/api' });

  return app;
}

async function start() {
  try {
    if (config.mode !== 'test') {
      await runMigrations();
    }
    const app = await buildApp();
    await app.listen({ port: config.port, host: '0.0.0.0' });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

const isDirect = process.argv[1] && import.meta.url.endsWith(process.argv[1]?.split(/[\\/]/).pop() || '');
if (isDirect) {
  start();
}

export default buildApp;
