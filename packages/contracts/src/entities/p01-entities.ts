import { z } from 'zod';
import {
  AttributionScopeSchema,
  ChangeIdSchema,
  CheckpointIdSchema,
  ClaimIdSchema,
  ControlStateSchema,
  EvidenceIdSchema,
  EvidenceOriginSchema,
  GapIdSchema,
  GapPrioritySchema,
  GapTypeSchema,
  HitlGateSchema,
  IsoTimestampSchema,
  MetricQualifierSchema,
  ProfileIdSchema,
  RepresentationIdSchema,
  SkillIdSchema,
  SourceIdSchema,
  TemporalPrecisionSchema,
  UserIdSchema,
} from '../common/ids-and-enums.js';

/**
 * 1. System Identity Registry (`USERS`)
 */
export const UserRecordSchema = z.object({
  USER_ID: UserIdSchema,
  FULL_NAME: z.string().min(1),
  PRIMARY_EMAIL: z.string().email(),
  PRIMARY_MARKET: z.string().min(1),
  STATUS: z.enum(['ACTIVE', 'SUSPENDED', 'ARCHIVED']),
  CREATED_AT: IsoTimestampSchema,
});
export type UserRecord = z.infer<typeof UserRecordSchema>;

/**
 * 2. Raw Sources (`SOURCES` — Store 1)
 */
export const SourceRecordSchema = z.object({
  SOURCE_ID: SourceIdSchema,
  USER_ID: UserIdSchema,
  SOURCE_TYPE: z.enum([
    'CV_DOCUMENT',
    'CERTIFICATE',
    'PROJECT_DOC',
    'REFERENCE_LETTER',
    'INTERVIEW_TRANSCRIPT',
    'OTHER',
  ]),
  FILE_NAME: z.string().min(1),
  DRIVE_FILE_ID: z.string().min(1).nullable(),
  STORAGE_PATH: z.string().min(1),
  EXTRACTION_STATUS: z.enum(['PENDING', 'EXTRACTED', 'FAILED']),
  INGESTED_AT: IsoTimestampSchema,
});
export type SourceRecord = z.infer<typeof SourceRecordSchema>;

/**
 * 3. Governed Evidence (`EVIDENCE` — Store 2)
 */
export const EvidenceRecordSchema = z.object({
  EVIDENCE_ID: EvidenceIdSchema,
  USER_ID: UserIdSchema,
  SOURCE_ID: SourceIdSchema.nullable(),
  RELATED_CLAIM_ID: ClaimIdSchema.nullable(),
  ORIGIN: EvidenceOriginSchema,
  STATEMENT: z.string().min(1),
  ATTRIBUTION_SCOPE: AttributionScopeSchema,
  START_DATE: z.string().nullable(),
  END_DATE: z.string().nullable(),
  TEMPORAL_PRECISION: TemporalPrecisionSchema,
  METRIC_VALUE: z.string().nullable(),
  METRIC_UNIT: z.string().nullable(),
  METRIC_QUALIFIER: MetricQualifierSchema,
  VERIFICATION_STATUS: z.enum([
    'UNVERIFIED',
    'VERIFIED',
    'CONFLICTED',
    'SUPERSEDED',
  ]),
  CREATED_AT: IsoTimestampSchema,
});
export type EvidenceRecord = z.infer<typeof EvidenceRecordSchema>;

/**
 * 4. Decomposed Claims (`CLAIMS` — Store 2)
 */
export const ClaimRecordSchema = z.object({
  CLAIM_ID: ClaimIdSchema,
  USER_ID: UserIdSchema,
  CLAIM_TYPE: z.enum([
    'ROLE_EXPERIENCE',
    'PROJECT_DELIVERY',
    'TECHNICAL_ARCHITECTURE',
    'QUANTIFIED_OUTCOME',
    'EDUCATION_CREDENTIAL',
    'CERTIFICATION',
    'LANGUAGE_PROFICIENCY',
  ]),
  SUBJECT: z.string().min(1),
  ORGANIZATION: z.string().nullable(),
  PROPOSITION: z.string().min(1),
  ATTRIBUTION_SCOPE: AttributionScopeSchema,
  START_DATE: z.string().nullable(),
  END_DATE: z.string().nullable(),
  TEMPORAL_PRECISION: TemporalPrecisionSchema,
  SUPPORTING_EVIDENCE_IDS: z.array(EvidenceIdSchema),
  VERIFICATION_STATE: z.enum([
    'DRAFT',
    'NEEDS_CLARIFICATION',
    'CONFLICTED',
    'VERIFIED',
    'PROMOTED',
    'SUPERSEDED',
  ]),
  CREATED_AT: IsoTimestampSchema,
});
export type ClaimRecord = z.infer<typeof ClaimRecordSchema>;

/**
 * 5. Epistemic Gaps (`GAPS` — Store 2 / M07)
 */
export const GapRecordSchema = z.object({
  GAP_ID: GapIdSchema,
  USER_ID: UserIdSchema,
  RELATED_CLAIM_ID: ClaimIdSchema,
  GAP_TYPE: GapTypeSchema,
  PRIORITY: GapPrioritySchema,
  SUBJECT: z.string().min(1),
  SCOPE: z.string().nullable(),
  MISSING_DIMENSION: z.string().min(1),
  TECHNICAL_PROMPT: z.string().min(1),
  STATUS: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'DEFERRED']),
  RESOLVED_BY_EVIDENCE_ID: EvidenceIdSchema.nullable(),
  CREATED_AT: IsoTimestampSchema,
  RESOLVED_AT: IsoTimestampSchema.nullable(),
});
export type GapRecord = z.infer<typeof GapRecordSchema>;

/**
 * 6. Explicit Contradictions (`CONFLICTS` — Store 2 / M10, Invariant G16)
 */
export const ConflictIdFlexibleSchema = z
  .string()
  .regex(
    /^CONF-([0-9]{4}|[0-9]{12}-[A-Z0-9]+-[0-9]{3})$/,
    'Expected CONF-XXXX or CONF-<ts>-...',
  );

export const ConflictRecordSchema = z.object({
  CONFLICT_ID: ConflictIdFlexibleSchema,
  USER_ID: UserIdSchema,
  CONFLICT_TYPE: z.enum([
    'TEMPORAL_OVERLAP',
    'DATE_MISMATCH',
    'METRIC_DISCREPANCY',
    'ATTRIBUTION_CONFLICT',
    'ROLE_TITLE_MISMATCH',
  ]),
  CLAIM_A_ID: ClaimIdSchema,
  CLAIM_B_ID: ClaimIdSchema.nullable(),
  EVIDENCE_A_ID: EvidenceIdSchema.nullable(),
  EVIDENCE_B_ID: EvidenceIdSchema.nullable(),
  DESCRIPTION: z.string().min(1),
  RESOLUTION_STATUS: z.enum([
    'OPEN',
    'GATE_B_PENDING',
    'RESOLVED',
    'SUPERSEDED',
  ]),
  RESOLUTION_NOTES: z.string().nullable(),
  CREATED_AT: IsoTimestampSchema,
  RESOLVED_AT: IsoTimestampSchema.nullable(),
});
export type ConflictRecord = z.infer<typeof ConflictRecordSchema>;

/**
 * 7. Canonical Professional Source of Truth (`CAREER_PROFILE` — Store 3 / PSOT)
 */
export const CareerProfileRecordSchema = z.object({
  PSOT_ID: ProfileIdSchema,
  USER_ID: UserIdSchema,
  ENTITY_TYPE: z.enum([
    'EXPERIENCE',
    'PROJECT',
    'EDUCATION',
    'CERTIFICATION',
    'LANGUAGE',
    'SUMMARY_ANCHOR',
  ]),
  TITLE: z.string().min(1),
  ORGANIZATION: z.string().nullable(),
  LOCATION: z.string().nullable(),
  START_DATE: z.string().nullable(),
  END_DATE: z.string().nullable(),
  TEMPORAL_PRECISION: TemporalPrecisionSchema,
  CANONICAL_STATEMENT: z.string().min(1),
  ATTRIBUTION_SCOPE: AttributionScopeSchema,
  PROVENANCE_CLAIM_IDS: z.array(ClaimIdSchema).min(1),
  PROVENANCE_EVIDENCE_IDS: z.array(EvidenceIdSchema).min(1),
  STATUS: z.enum(['ACTIVE', 'SUPERSEDED']),
  PROMOTED_AT: IsoTimestampSchema,
});
export type CareerProfileRecord = z.infer<typeof CareerProfileRecordSchema>;

/**
 * 8. Canonical Skills Registry (`SKILLS` — Store 3 / PSOT, Invariant G07)
 */
export const SkillRecordSchema = z.object({
  SKILL_ID: SkillIdSchema,
  USER_ID: UserIdSchema,
  SKILL_NAME: z.string().min(1),
  CATEGORY: z.enum([
    'LANGUAGE_FRAMEWORK',
    'ARCHITECTURE_PATTERN',
    'DATA_STORAGE',
    'CLOUD_DEVOPS',
    'WORKFLOW_AUTOMATION',
    'DOMAIN_EXPERTISE',
    'SPOKEN_LANGUAGE',
  ]),
  EVIDENCED_DEPTH: z.enum(['MENTIONED', 'APPLIED', 'ARCHITECTED', 'CERTIFIED']),
  PROVENANCE_EVIDENCE_IDS: z.array(EvidenceIdSchema).min(1),
  STATUS: z.enum(['ACTIVE', 'SUPERSEDED']),
  UPDATED_AT: IsoTimestampSchema,
});
export type SkillRecord = z.infer<typeof SkillRecordSchema>;

/**
 * 9. Derived Master Resume Representations (`REPRESENTATIONS` — Store 4, Invariants G18/G19/G29)
 */
export const RepresentationRecordSchema = z.object({
  REPRESENTATION_ID: RepresentationIdSchema,
  USER_ID: UserIdSchema,
  RESUME_VERSION: z.string().min(1),
  SECTION: z.enum([
    'HEADER',
    'EXECUTIVE_SUMMARY',
    'CORE_COMPETENCIES',
    'EXPERIENCE',
    'KEY_PROJECTS',
    'EDUCATION',
    'CERTIFICATIONS',
    'LANGUAGES',
  ]),
  CONTENT_MARKDOWN: z.string().min(1),
  SOURCE_PSOT_IDS: z.array(ProfileIdSchema),
  SOURCE_SKILL_IDS: z.array(SkillIdSchema),
  AUDIT_STATUS: z.enum([
    'PENDING_M16',
    'PASSED_M16',
    'FAILED_M16',
    'APPROVED_GATE_D',
  ]),
  ARTIFACT_DRIVE_PATH: z.string().nullable(),
  CREATED_AT: IsoTimestampSchema,
});
export type RepresentationRecord = z.infer<typeof RepresentationRecordSchema>;

/**
 * 10. Immutable Audit Ledger (`CHANGE_LOG` — 9 columns per CF-ARCH-FREEZE-V1.0)
 */
export const ChangeLogRecordSchema = z.object({
  CHANGE_ID: ChangeIdSchema,
  USER_ID: UserIdSchema,
  RECORD_ID: z.string().min(1),
  TABLE_NAME: z.string().min(1),
  CHANGE_TYPE: z.enum([
    'CREATE',
    'UPDATE',
    'PROMOTE',
    'SUPERSEDE',
    'GATE_APPROVAL',
  ]),
  ACTOR: z.enum(['SYSTEM_N8N', 'AI_EXECUTION', 'HUMAN_USER']),
  REASON: z.string().min(1),
  PREVIOUS_STATE_HASH: z.string().nullable(),
  TIMESTAMP: IsoTimestampSchema,
});
export type ChangeLogRecord = z.infer<typeof ChangeLogRecordSchema>;

/**
 * 11. Deterministic State Machine Ledger (`RUNTIME_STATE` — 14 columns per CF-ARCH-FREEZE-V1.0)
 */
export const RuntimeStateRecordSchema = z.object({
  CHECKPOINT_ID: CheckpointIdSchema,
  USER_ID: UserIdSchema,
  PROCESS_ID: z.enum(['P00', 'P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07']),
  LIFECYCLE_STATE: z.enum([
    'PLANNED',
    'IN_DESIGN',
    'IMPLEMENTATION_READY',
    'IMPLEMENTED',
    'VALIDATED',
    'FROZEN',
  ]),
  WORKFLOW_STATE: z.string().min(1),
  CONTROL_STATE: ControlStateSchema,
  ACTIVE_GATE: HitlGateSchema.nullable(),
  SOURCES_COUNT: z.number().int().nonnegative(),
  CLAIMS_COUNT: z.number().int().nonnegative(),
  EVIDENCE_COUNT: z.number().int().nonnegative(),
  OPEN_GAPS_COUNT: z.number().int().nonnegative(),
  OPEN_CONFLICTS_COUNT: z.number().int().nonnegative(),
  LAST_ERROR: z.string().nullable(),
  UPDATED_AT: IsoTimestampSchema,
});
export type RuntimeStateRecord = z.infer<typeof RuntimeStateRecordSchema>;
