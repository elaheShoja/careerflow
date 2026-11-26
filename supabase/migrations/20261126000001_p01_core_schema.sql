-- ==============================================================================
-- CareerFlow V1.0 — Core Operational & Epistemic Schema (P00–P01 Baseline)
-- ==============================================================================
-- Governing Specs:
--   - CF-ARCH-FREEZE-V1.0 (Section 3: Identity & Multi-User Model)
--   - CF-SPEC-M08-INTERVIEW-V1.0
--   - @careerflow/contracts (p01-entities.ts)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. System-Level Tables (Shared across deployment)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.users (
  user_id TEXT PRIMARY KEY CHECK (user_id ~ '^USR-[0-9]{4}$'),
  full_name TEXT NOT NULL,
  primary_email TEXT NOT NULL UNIQUE,
  primary_market TEXT NOT NULL DEFAULT 'Germany',
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'ARCHIVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.configuration (
  config_id TEXT PRIMARY KEY CHECK (config_id ~ '^CFG-[0-9]{4}$'),
  category TEXT NOT NULL,
  config_key TEXT NOT NULL UNIQUE,
  config_value TEXT NOT NULL,
  is_secret BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. User-Scoped Epistemic & Operational Tables (Store 1 -> Store 4)
-- ------------------------------------------------------------------------------

-- Store 1: Raw Sources
CREATE TABLE IF NOT EXISTS public.sources (
  source_id TEXT PRIMARY KEY CHECK (source_id ~ '^SRCE-[0-9]{4}$'),
  user_id TEXT NOT NULL REFERENCES public.users(user_id) ON DELETE RESTRICT,
  source_type TEXT NOT NULL CHECK (
    source_type IN (
      'CV_DOCUMENT',
      'CERTIFICATE',
      'PROJECT_DOC',
      'REFERENCE_LETTER',
      'INTERVIEW_TRANSCRIPT',
      'OTHER'
    )
  ),
  file_name TEXT NOT NULL,
  drive_file_id TEXT,
  storage_path TEXT NOT NULL,
  extraction_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (
    extraction_status IN ('PENDING', 'EXTRACTED', 'FAILED')
  ),
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sources_user_id ON public.sources(user_id);

-- Store 2: Decomposed Claims
CREATE TABLE IF NOT EXISTS public.claims (
  claim_id TEXT PRIMARY KEY CHECK (claim_id ~ '^CLAM-[0-9]{4}$'),
  user_id TEXT NOT NULL REFERENCES public.users(user_id) ON DELETE RESTRICT,
  claim_type TEXT NOT NULL CHECK (
    claim_type IN (
      'ROLE_EXPERIENCE',
      'PROJECT_DELIVERY',
      'TECHNICAL_ARCHITECTURE',
      'QUANTIFIED_OUTCOME',
      'EDUCATION_CREDENTIAL',
      'CERTIFICATION',
      'LANGUAGE_PROFICIENCY'
    )
  ),
  subject TEXT NOT NULL,
  organization TEXT,
  proposition TEXT NOT NULL,
  attribution_scope TEXT NOT NULL CHECK (
    attribution_scope IN (
      'INDIVIDUAL_CONTRIBUTION',
      'TEAM_LEAD',
      'TEAM_MEMBER',
      'SHARED_OWNERSHIP',
      'ORGANIZATION_PROXY'
    )
  ),
  start_date TEXT,
  end_date TEXT,
  temporal_precision TEXT NOT NULL CHECK (
    temporal_precision IN ('DAY', 'MONTH', 'YEAR', 'QUARTER', 'APPROXIMATE', 'UNKNOWN')
  ),
  supporting_evidence_ids TEXT[] NOT NULL DEFAULT '{}',
  verification_state TEXT NOT NULL DEFAULT 'DRAFT' CHECK (
    verification_state IN (
      'DRAFT',
      'NEEDS_CLARIFICATION',
      'CONFLICTED',
      'VERIFIED',
      'PROMOTED',
      'SUPERSEDED'
    )
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claims_user_id ON public.claims(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_verification_state ON public.claims(user_id, verification_state);

-- Store 2: Governed Evidence
CREATE TABLE IF NOT EXISTS public.evidence (
  evidence_id TEXT PRIMARY KEY CHECK (evidence_id ~ '^EVDS-[0-9]{4}$'),
  user_id TEXT NOT NULL REFERENCES public.users(user_id) ON DELETE RESTRICT,
  source_id TEXT REFERENCES public.sources(source_id) ON DELETE SET NULL,
  related_claim_id TEXT REFERENCES public.claims(claim_id) ON DELETE SET NULL,
  origin TEXT NOT NULL CHECK (
    origin IN ('DOCUMENTARY_SOURCE', 'USER_STATEMENT', 'DERIVED_SYNTHESIS')
  ),
  statement TEXT NOT NULL,
  attribution_scope TEXT NOT NULL CHECK (
    attribution_scope IN (
      'INDIVIDUAL_CONTRIBUTION',
      'TEAM_LEAD',
      'TEAM_MEMBER',
      'SHARED_OWNERSHIP',
      'ORGANIZATION_PROXY'
    )
  ),
  start_date TEXT,
  end_date TEXT,
  temporal_precision TEXT NOT NULL CHECK (
    temporal_precision IN ('DAY', 'MONTH', 'YEAR', 'QUARTER', 'APPROXIMATE', 'UNKNOWN')
  ),
  metric_value TEXT,
  metric_unit TEXT,
  metric_qualifier TEXT NOT NULL DEFAULT 'NONE' CHECK (
    metric_qualifier IN ('EXACT', 'APPROXIMATE', 'MORE_THAN', 'UP_TO', 'NONE')
  ),
  verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED' CHECK (
    verification_status IN ('UNVERIFIED', 'VERIFIED', 'CONFLICTED', 'SUPERSEDED')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_user_id ON public.evidence(user_id);
CREATE INDEX IF NOT EXISTS idx_evidence_claim_id ON public.evidence(related_claim_id);

-- Store 2: Epistemic Gaps (Module M07 / M08)
CREATE TABLE IF NOT EXISTS public.gaps (
  gap_id TEXT PRIMARY KEY CHECK (gap_id ~ '^GAP-[0-9]{4}$'),
  user_id TEXT NOT NULL REFERENCES public.users(user_id) ON DELETE RESTRICT,
  related_claim_id TEXT NOT NULL REFERENCES public.claims(claim_id) ON DELETE CASCADE,
  gap_type TEXT NOT NULL CHECK (
    gap_type IN ('TEMPORAL', 'METRIC', 'ATTRIBUTION', 'SCOPE', 'PROVENANCE', 'CONTRADICTION')
  ),
  priority TEXT NOT NULL CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  subject TEXT NOT NULL,
  scope TEXT,
  missing_dimension TEXT NOT NULL,
  technical_prompt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (
    status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'DEFERRED')
  ),
  resolved_by_evidence_id TEXT REFERENCES public.evidence(evidence_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_gaps_user_open ON public.gaps(user_id, status, priority);

-- Store 2: Explicit Contradictions (Module M10, Invariant G16)
CREATE TABLE IF NOT EXISTS public.conflicts (
  conflict_id TEXT PRIMARY KEY CHECK (
    conflict_id ~ '^CONF-([0-9]{4}|[0-9]{12}-[A-Z0-9]+-[0-9]{3})$'
  ),
  user_id TEXT NOT NULL REFERENCES public.users(user_id) ON DELETE RESTRICT,
  conflict_type TEXT NOT NULL CHECK (
    conflict_type IN (
      'TEMPORAL_OVERLAP',
      'DATE_MISMATCH',
      'METRIC_DISCREPANCY',
      'ATTRIBUTION_CONFLICT',
      'ROLE_TITLE_MISMATCH'
    )
  ),
  claim_a_id TEXT NOT NULL REFERENCES public.claims(claim_id) ON DELETE CASCADE,
  claim_b_id TEXT REFERENCES public.claims(claim_id) ON DELETE SET NULL,
  evidence_a_id TEXT REFERENCES public.evidence(evidence_id) ON DELETE SET NULL,
  evidence_b_id TEXT REFERENCES public.evidence(evidence_id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  resolution_status TEXT NOT NULL DEFAULT 'OPEN' CHECK (
    resolution_status IN ('OPEN', 'GATE_B_PENDING', 'RESOLVED', 'SUPERSEDED')
  ),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_conflicts_user_status ON public.conflicts(user_id, resolution_status);

-- Store 3: Canonical Professional Source of Truth (`CAREER_PROFILE` / PSOT)
CREATE TABLE IF NOT EXISTS public.career_profile (
  psot_id TEXT PRIMARY KEY CHECK (psot_id ~ '^PROF-[0-9]{4}$'),
  user_id TEXT NOT NULL REFERENCES public.users(user_id) ON DELETE RESTRICT,
  entity_type TEXT NOT NULL CHECK (
    entity_type IN (
      'EXPERIENCE',
      'PROJECT',
      'EDUCATION',
      'CERTIFICATION',
      'LANGUAGE',
      'SUMMARY_ANCHOR'
    )
  ),
  title TEXT NOT NULL,
  organization TEXT,
  location TEXT,
  start_date TEXT,
  end_date TEXT,
  temporal_precision TEXT NOT NULL CHECK (
    temporal_precision IN ('DAY', 'MONTH', 'YEAR', 'QUARTER', 'APPROXIMATE', 'UNKNOWN')
  ),
  canonical_statement TEXT NOT NULL,
  attribution_scope TEXT NOT NULL CHECK (
    attribution_scope IN (
      'INDIVIDUAL_CONTRIBUTION',
      'TEAM_LEAD',
      'TEAM_MEMBER',
      'SHARED_OWNERSHIP',
      'ORGANIZATION_PROXY'
    )
  ),
  provenance_claim_ids TEXT[] NOT NULL CHECK (cardinality(provenance_claim_ids) >= 1),
  provenance_evidence_ids TEXT[] NOT NULL CHECK (cardinality(provenance_evidence_ids) >= 1),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUPERSEDED')),
  promoted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_career_profile_user_status ON public.career_profile(user_id, status);

-- Store 3: Canonical Skills Registry (`SKILLS`, Invariant G07)
CREATE TABLE IF NOT EXISTS public.skills (
  skill_id TEXT PRIMARY KEY CHECK (skill_id ~ '^SKIL-[0-9]{4}$'),
  user_id TEXT NOT NULL REFERENCES public.users(user_id) ON DELETE RESTRICT,
  skill_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (
    category IN (
      'LANGUAGE_FRAMEWORK',
      'ARCHITECTURE_PATTERN',
      'DATA_STORAGE',
      'CLOUD_DEVOPS',
      'WORKFLOW_AUTOMATION',
      'DOMAIN_EXPERTISE',
      'SPOKEN_LANGUAGE'
    )
  ),
  evidenced_depth TEXT NOT NULL CHECK (
    evidenced_depth IN ('MENTIONED', 'APPLIED', 'ARCHITECTED', 'CERTIFIED')
  ),
  provenance_evidence_ids TEXT[] NOT NULL CHECK (cardinality(provenance_evidence_ids) >= 1),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUPERSEDED')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skills_user_status ON public.skills(user_id, status);

-- Store 4: Derived Master Resume Representations (`REPRESENTATIONS`, Invariants G18/G19/G29)
CREATE TABLE IF NOT EXISTS public.representations (
  representation_id TEXT PRIMARY KEY CHECK (representation_id ~ '^REPR-[0-9]{4}$'),
  user_id TEXT NOT NULL REFERENCES public.users(user_id) ON DELETE RESTRICT,
  resume_version TEXT NOT NULL,
  section TEXT NOT NULL CHECK (
    section IN (
      'HEADER',
      'EXECUTIVE_SUMMARY',
      'CORE_COMPETENCIES',
      'EXPERIENCE',
      'KEY_PROJECTS',
      'EDUCATION',
      'CERTIFICATIONS',
      'LANGUAGES'
    )
  ),
  content_markdown TEXT NOT NULL,
  source_psot_ids TEXT[] NOT NULL DEFAULT '{}',
  source_skill_ids TEXT[] NOT NULL DEFAULT '{}',
  audit_status TEXT NOT NULL DEFAULT 'PENDING_M16' CHECK (
    audit_status IN ('PENDING_M16', 'PASSED_M16', 'FAILED_M16', 'APPROVED_GATE_D')
  ),
  artifact_drive_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_representations_user_version ON public.representations(user_id, resume_version);

-- ------------------------------------------------------------------------------
-- 3. Immutable Audit & State Machine Ledgers
-- ------------------------------------------------------------------------------

-- CHANGE_LOG (9 columns per CF-ARCH-FREEZE-V1.0)
CREATE TABLE IF NOT EXISTS public.change_log (
  change_id TEXT PRIMARY KEY CHECK (change_id ~ '^CHG-[0-9]{4}$'),
  user_id TEXT NOT NULL REFERENCES public.users(user_id) ON DELETE RESTRICT,
  record_id TEXT NOT NULL,
  table_name TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (
    change_type IN ('CREATE', 'UPDATE', 'PROMOTE', 'SUPERSEDE', 'GATE_APPROVAL')
  ),
  actor TEXT NOT NULL CHECK (actor IN ('SYSTEM_N8N', 'AI_EXECUTION', 'HUMAN_USER')),
  reason TEXT NOT NULL,
  previous_state_hash TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_change_log_user_record ON public.change_log(user_id, record_id);

-- RUNTIME_STATE (14 columns per CF-ARCH-FREEZE-V1.0)
CREATE TABLE IF NOT EXISTS public.runtime_state (
  checkpoint_id TEXT PRIMARY KEY CHECK (
    checkpoint_id ~ '^(CKPT-[0-9]{4}|CHK-[A-Z0-9-]+)$'
  ),
  user_id TEXT NOT NULL REFERENCES public.users(user_id) ON DELETE RESTRICT,
  process_id TEXT NOT NULL CHECK (
    process_id IN ('P00', 'P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07')
  ),
  lifecycle_state TEXT NOT NULL CHECK (
    lifecycle_state IN (
      'PLANNED',
      'IN_DESIGN',
      'IMPLEMENTATION_READY',
      'IMPLEMENTED',
      'VALIDATED',
      'FROZEN'
    )
  ),
  workflow_state TEXT NOT NULL,
  control_state TEXT NOT NULL CHECK (
    control_state IN ('RUNNING', 'WAITING_FOR_HUMAN', 'COMPLETED', 'EXCEPTION_HALTED', 'IDLE')
  ),
  active_gate TEXT CHECK (
    active_gate IN (
      'GATE_A_DISCOVERY',
      'GATE_B_CONFLICTS',
      'GATE_C_PSOT_PROMOTION',
      'GATE_D_MASTER_RESUME'
    )
  ),
  sources_count INTEGER NOT NULL DEFAULT 0 CHECK (sources_count >= 0),
  claims_count INTEGER NOT NULL DEFAULT 0 CHECK (claims_count >= 0),
  evidence_count INTEGER NOT NULL DEFAULT 0 CHECK (evidence_count >= 0),
  open_gaps_count INTEGER NOT NULL DEFAULT 0 CHECK (open_gaps_count >= 0),
  open_conflicts_count INTEGER NOT NULL DEFAULT 0 CHECK (open_conflicts_count >= 0),
  last_error TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_runtime_state_user_process ON public.runtime_state(user_id, process_id, updated_at DESC);

-- ------------------------------------------------------------------------------
-- 4. Row-Level Security (RLS) Enablement
-- ------------------------------------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.representations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runtime_state ENABLE ROW LEVEL SECURITY;