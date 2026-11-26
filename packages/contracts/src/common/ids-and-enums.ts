import { z } from 'zod';

/**
 * Authoritative Stable ID Schemas (CF-ARCH-FREEZE-V1.0 Section 3)
 * Preserves immutable record prefixes while enforcing user scoping.
 */
export const UserIdSchema = z
  .string()
  .regex(/^USR-[0-9]{4}$/, 'Expected USR-XXXX');
export const SourceIdSchema = z
  .string()
  .regex(/^SRCE-[0-9]{4}$/, 'Expected SRCE-XXXX');
export const EvidenceIdSchema = z
  .string()
  .regex(/^EVDS-[0-9]{4}$/, 'Expected EVDS-XXXX');
export const ClaimIdSchema = z
  .string()
  .regex(/^CLAM-[0-9]{4}$/, 'Expected CLAM-XXXX');
export const GapIdSchema = z
  .string()
  .regex(/^GAP-[0-9]{4}$/, 'Expected GAP-XXXX');
export const ConflictIdSchema = z
  .string()
  .regex(/^CONF-[0-9]{4}$/, 'Expected CONF-XXXX');
export const ProfileIdSchema = z
  .string()
  .regex(/^PROF-[0-9]{4}$/, 'Expected PROF-XXXX');
export const SkillIdSchema = z
  .string()
  .regex(/^SKIL-[0-9]{4}$/, 'Expected SKIL-XXXX');
export const RepresentationIdSchema = z
  .string()
  .regex(/^REPR-[0-9]{4}$/, 'Expected REPR-XXXX');
export const ChangeIdSchema = z
  .string()
  .regex(/^CHG-[0-9]{4}$/, 'Expected CHG-XXXX');
export const CheckpointIdSchema = z
  .string()
  .regex(/^(CKPT-[0-9]{4}|CHK-[A-Z0-9-]+)$/, 'Expected CKPT-XXXX or CHK-*');

export type UserId = z.infer<typeof UserIdSchema>;
export type SourceId = z.infer<typeof SourceIdSchema>;
export type EvidenceId = z.infer<typeof EvidenceIdSchema>;
export type ClaimId = z.infer<typeof ClaimIdSchema>;
export type GapId = z.infer<typeof GapIdSchema>;
export type ConflictId = z.infer<typeof ConflictIdSchema>;
export type ProfileId = z.infer<typeof ProfileIdSchema>;
export type SkillId = z.infer<typeof SkillIdSchema>;
export type RepresentationId = z.infer<typeof RepresentationIdSchema>;
export type ChangeId = z.infer<typeof ChangeIdSchema>;
export type CheckpointId = z.infer<typeof CheckpointIdSchema>;

/**
 * ISO-8601 Timestamp String
 */
export const IsoTimestampSchema = z.string().datetime({ offset: true });
export type IsoTimestamp = z.infer<typeof IsoTimestampSchema>;

/**
 * Epistemic Attribution & Precision Enums (Invariants G03–G11 & CF-SPEC-M08-INTERVIEW-V1.0)
 */
export const AttributionScopeSchema = z.enum([
  'INDIVIDUAL_CONTRIBUTION',
  'TEAM_LEAD',
  'TEAM_MEMBER',
  'SHARED_OWNERSHIP',
  'ORGANIZATION_PROXY',
]);
export type AttributionScope = z.infer<typeof AttributionScopeSchema>;

export const TemporalPrecisionSchema = z.enum([
  'DAY',
  'MONTH',
  'YEAR',
  'QUARTER',
  'APPROXIMATE',
  'UNKNOWN',
]);
export type TemporalPrecision = z.infer<typeof TemporalPrecisionSchema>;

export const MetricQualifierSchema = z.enum([
  'EXACT',
  'APPROXIMATE',
  'MORE_THAN',
  'UP_TO',
  'NONE',
]);
export type MetricQualifier = z.infer<typeof MetricQualifierSchema>;

export const EvidenceOriginSchema = z.enum([
  'DOCUMENTARY_SOURCE',
  'USER_STATEMENT',
  'DERIVED_SYNTHESIS',
]);
export type EvidenceOrigin = z.infer<typeof EvidenceOriginSchema>;

export const GapTypeSchema = z.enum([
  'TEMPORAL',
  'METRIC',
  'ATTRIBUTION',
  'SCOPE',
  'PROVENANCE',
  'CONTRADICTION',
]);
export type GapType = z.infer<typeof GapTypeSchema>;

export const GapPrioritySchema = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);
export type GapPriority = z.infer<typeof GapPrioritySchema>;

/**
 * Human-in-the-Loop (HITL) Gates & Control States (P01 State Transition Matrix)
 */
export const HitlGateSchema = z.enum([
  'GATE_A_DISCOVERY',
  'GATE_B_CONFLICTS',
  'GATE_C_PSOT_PROMOTION',
  'GATE_D_MASTER_RESUME',
]);
export type HitlGate = z.infer<typeof HitlGateSchema>;

export const ControlStateSchema = z.enum([
  'RUNNING',
  'WAITING_FOR_HUMAN',
  'COMPLETED',
  'EXCEPTION_HALTED',
  'IDLE',
]);
export type ControlState = z.infer<typeof ControlStateSchema>;
