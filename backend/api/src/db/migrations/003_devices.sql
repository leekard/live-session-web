-- 003_devices.sql
-- Introducing the devices domain entity and configurable per-plan device limits.

CREATE TABLE IF NOT EXISTS devices (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id     TEXT NOT NULL,
  name          TEXT,
  status        TEXT NOT NULL DEFAULT 'active',   -- 'active' | 'revoked'
  token_version INT  NOT NULL DEFAULT 0,          -- bump to invalidate issued tokens
  last_seen_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_devices_user ON devices (user_id);
CREATE INDEX IF NOT EXISTS idx_devices_device ON devices (device_id);

-- Configurable per-plan active device limits (0 = unlimited).
CREATE TABLE IF NOT EXISTS plan_limits (
  plan         TEXT PRIMARY KEY,                  -- 'free' | 'basic' | 'pro' | 'team'
  device_limit INT NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO plan_limits (plan, device_limit) VALUES
  ('free', 1),
  ('basic', 1),
  ('pro', 3),
  ('team', 0)
ON CONFLICT (plan) DO NOTHING;

-- Carry the desktop-provided display name onto the pending code so confirm
-- can copy it into the devices row (the user is unknown at login time).
ALTER TABLE device_codes ADD COLUMN IF NOT EXISTS name TEXT;

-- Backfill: promote already-approved device codes into device rows.
INSERT INTO devices (user_id, device_id, name, status, token_version, last_seen_at)
SELECT dc.user_id, dc.device_id, NULL, 'active', 0, dc.created_at
FROM device_codes dc
WHERE dc.status = 'approved' AND dc.user_id IS NOT NULL
ON CONFLICT (user_id, device_id) DO NOTHING;
