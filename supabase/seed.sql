-- ==============================================================================
-- CareerFlow V1.0 — Idempotent Database Seed (P00 Baseline & USR-0001)
-- ==============================================================================
-- Governing Specs:
--   - CF-ARCH-FREEZE-V1.0 (Section 3.1 & Section 3.2)
--   - ADR-0001 (Multi-Provider AI Abstraction & Capability-Based Routing)
-- Security Rule (CFG-0016): Never place API keys or tokens in seed.sql.
-- ==============================================================================

-- 1. System Identity Registry (`USERS`)
INSERT INTO public.users (
  user_id,
  full_name,
  primary_email,
  primary_market,
  status,
  created_at
)
VALUES (
  'USR-0001',
  'Elahe Shoja',
  'elaheshoja.p@gmail.com',
  'Germany',
  'ACTIVE',
  '2026-10-01T00:00:00.000Z'
)
ON CONFLICT (user_id) DO NOTHING;

-- 2. System Operational Configuration (`CONFIGURATION`)
INSERT INTO public.configuration (
  config_id,
  category,
  config_key,
  config_value,
  is_secret,
  description
)
VALUES
  ('CFG-0001', 'SYSTEM', 'SYSTEM_VERSION', '1.0.0', FALSE, 'Frozen CareerFlow V1 architecture version'),
  ('CFG-0002', 'SYSTEM', 'DEFAULT_USER_ID', 'USR-0001', FALSE, 'Primary V1 single-user operational scope'),
  ('CFG-0003', 'SYSTEM', 'RUNTIME_ENVIRONMENT', 'DEVELOPMENT', FALSE, 'Deployment environment tier (DEVELOPMENT | TEST | PRODUCTION)'),
  ('CFG-0004', 'GOVERNANCE', 'EXECUTION_MODE', 'HUMAN_CONTROLLED_HYBRID', FALSE, 'Enforces mandatory human checkpoints Gates A-D'),
  ('CFG-0005', 'GOVERNANCE', 'ENFORCE_INVARIANTS', 'G01-G32', FALSE, 'Active epistemic and provenance governance invariant set'),
  ('CFG-0006', 'AI_ROUTING', 'AI_DEFAULT_PROVIDER', 'gemini', FALSE, 'Default AI provider when no capability override is specified (ADR-0001)'),
  ('CFG-0007', 'AI_ROUTING', 'AI_FALLBACK_PROVIDER', 'anthropic', FALSE, 'Secondary fallback AI provider for resilience (ADR-0001)'),
  ('CFG-0008', 'AI_ROUTING', 'AI_ENABLE_FALLBACK', 'true', FALSE, 'Enables automatic failover across configured AI providers'),
  ('CFG-0009', 'AI_ROUTING', 'AI_ROUTING_POLICY_PATH', 'ai/routing-policy.json', FALSE, 'Path to active capability-to-provider routing policy'),
  ('CFG-0010', 'STORAGE', 'PRIMARY_STORAGE_BACKEND', 'supabase', FALSE, 'Active persistence backend (google-workspace | supabase | dual-write)'),
  ('CFG-0011', 'STORAGE', 'DRIVE_USER_ROOT_TEMPLATE', 'CareerFlow/Users/{USER_ID}', FALSE, 'User-isolated Google Drive root path template'),
  ('CFG-0012', 'SECURITY', 'CLIENT_SECRET_EXPOSURE', 'FORBIDDEN', FALSE, 'Strict prohibition against exposing server/AI secrets in client bundles')
ON CONFLICT (config_id) DO NOTHING;