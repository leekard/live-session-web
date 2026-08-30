-- 001_initial_schema.sql
CREATE TABLE IF NOT EXISTS users (
  id            BIGSERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user',      -- 'user' | 'admin'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS device_codes (
  code         TEXT PRIMARY KEY,
  device_id    TEXT NOT NULL,
  user_id      BIGINT NULL REFERENCES users(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending',     -- 'pending' | 'approved' | 'expired'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_device_codes_device ON device_codes (device_id);

CREATE TABLE IF NOT EXISTS licenses (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan          TEXT NOT NULL,                       -- 'free' | 'basic' | 'pro' | 'team'
  status        TEXT NOT NULL DEFAULT 'active',      -- 'active' | 'expired' | 'revoked'
  license_key   TEXT UNIQUE NOT NULL,
  device_id     TEXT NULL,
  activated_at  TIMESTAMPTZ NULL,
  expires_at    TIMESTAMPTZ NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_licenses_user ON licenses (user_id);
CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses (license_key);

CREATE TABLE IF NOT EXISTS orders (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan          TEXT NOT NULL,
  amount        NUMERIC(12,2) NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'RUB',
  status        TEXT NOT NULL DEFAULT 'paid',        -- 'pending' | 'paid' | 'cancelled' | 'refunded'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (user_id);
