-- 005_founder.sql
-- Founder is a lifetime plan, not purchasable, with unlimited devices (0 = unlimited).
INSERT INTO plan_limits (plan, device_limit) VALUES ('founder', 0)
ON CONFLICT (plan) DO NOTHING;
