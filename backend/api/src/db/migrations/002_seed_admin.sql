-- 002_seed_admin.sql
-- Creates the initial admin user (idempotent, only if no admin exists).
INSERT INTO users (email, password_hash, role)
SELECT $1, $2, 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin');
