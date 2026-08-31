-- 004_releases.sql
-- Introducing desktop releases: admin-uploaded installer versions published to clients.

CREATE TABLE IF NOT EXISTS releases (
  id            BIGSERIAL PRIMARY KEY,
  version       TEXT NOT NULL UNIQUE,           -- semantic version, e.g. '1.0.8'
  file_name     TEXT NOT NULL,                  -- file name inside the downloads volume
  file_size     BIGINT NOT NULL,                -- bytes
  notes         TEXT,                           -- release notes / changelog message
  published     BOOLEAN NOT NULL DEFAULT false, -- only published releases are offered
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_releases_published ON releases (published, published_at DESC);
