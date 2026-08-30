import 'dotenv/config';

export interface Config {
  port: number;
  mode: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  db: {
    connectionString: string;
  };
  cookieName: string;
  adminEmail: string;
  adminPassword: string;
  deviceCodeTtlMs: number;
  webOrigin: string;
}

function required(name: string, fallback?: string): string {
  const v = process.env[name];
  if (v !== undefined && v !== '') return v;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required env var: ${name}`);
}

export function loadConfig(): Config {
  return {
    port: parseInt(process.env.PORT || '3001', 10),
    mode: process.env.NODE_ENV || 'development',
    jwtSecret: required('JWT_SECRET', 'dev-secret-change-me'),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    db: {
      connectionString: required('DATABASE_URL', 'postgres://livesession:livesession@localhost:5432/livesession'),
    },
    cookieName: process.env.COOKIE_NAME || 'livesession_auth',
    adminEmail: process.env.ADMIN_EMAIL || 'admin@livesession.local',
    adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
    deviceCodeTtlMs: parseInt(process.env.DEVICE_CODE_TTL_MS || '300000', 10),
    webOrigin: process.env.WEB_ORIGIN || '*',
  };
}

export const config = loadConfig();
