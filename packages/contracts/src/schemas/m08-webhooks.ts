import { z } from 'zod';
import {
  AttributionScopeSchema,
  CheckpointIdSchema,
  ClaimIdSchema,
  EvidenceIdSchema,
  GapIdSchema,
  GapPrioritySchema,
  GapTypeSchema,
  IsoTimestampSchema,
  MetricQualifierSchema,
  TemporalPrecisionSchema,
  UserIdSchema,
} from '../common/ids-and-enums.js';

/**
 * 1. Process Initiation (`POST /webhook/p01-initiate` — CF-ARCH-FREEZE-V1.0 Section 5.1)
 */
export const P01InitiateRequestSchema = z.object({
  user_id: UserIdSchema,
  command: z.literal('START'),
  timestamp: IsoTimestampSchema,
});
export type P01InitiateRequest = z.infer<typeof P01InitiateRequestSchema>;

export const P01InitiateResponseSchema = z.object({
  status: z.enum(['PROCESSING_STARTED', 'ALREADY_ACTIVE', 'REJECTED']),
  user_id: UserIdSchema,
  checkpoint_id: CheckpointIdSchema,
  sources_detected: z.number().int().nonnegative(),
  message: z.string().min(1),
});
export type P01InitiateResponse = z.infer<typeof P01InitiateResponseSchema>;

/**
 * 2. Fetch Next Prioritized Gap (`GET /webhook/p01-interview-next` — CF-SPEC-M08-INTERVIEW-V1.0 Section 2.1)
 */
export const M08InterviewNextOpenSchema = z.object({
  has_open_gaps: z.literal(true),
  user_id: UserIdSchema,
  gap_id: GapIdSchema,
  gap_type: GapTypeSchema,
  priority: GapPrioritySchema,
  context: z.object({
    subject: z.string().min(1),
    related_claim_id: ClaimIdSchema,
    missing_dimension: z.string().min(1),
    scope: z.string().nullable().optional(),
  }),
  technical_prompt: z.string().min(1),
});
export type M08InterviewNextOpen = z.infer<typeof M08InterviewNextOpenSchema>;

export const M08InterviewNextConvergedSchema = z.object({
  has_open_gaps: z.literal(false),
  user_id: UserIdSchema,
  gap_id: z.null(),
  priority: z.null(),
  next_phase: z.literal('GATE_C_READY'),
  remaining_open_gaps: z.literal(0),
  message: z.string().min(1),
});
export type M08InterviewNextConverged = z.infer<
  typeof M08InterviewNextConvergedSchema
>;

export const M08InterviewNextResponseSchema = z.discriminatedUnion(
  'has_open_gaps',
  [M08InterviewNextOpenSchema, M08InterviewNextConvergedSchema],
);
export type M08InterviewNextResponse = z.infer<
  typeof M08InterviewNextResponseSchema
>;

/**
 * 3. Submit Completed Interview Turn (`POST /webhook/p01-interview-turn` — CF-SPEC-M08-INTERVIEW-V1.0 Section 2.2)
 */
export const TemporalBoundsSchema = z.object({
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  precision: TemporalPrecisionSchema,
});
export type TemporalBounds = z.infer<typeof TemporalBoundsSchema>;

export const MetricDimensionSchema = z.object({
  value: z.string().min(1),
  unit: z.string().min(1),
  qualifier: MetricQualifierSchema,
});
export type MetricDimension = z.infer<typeof MetricDimensionSchema>;

export const M08InterviewTurnRequestSchema = z.object({
  user_id: UserIdSchema,
  gap_id: GapIdSchema,
  related_claim_id: ClaimIdSchema,
  user_statement: z.string().min(20),
  attribution_confirmed: AttributionScopeSchema,
  temporal_bounds: TemporalBoundsSchema,
  metric_dimension: MetricDimensionSchema,
  timestamp: IsoTimestampSchema,
});
export type M08InterviewTurnRequest = z.infer<
  typeof M08InterviewTurnRequestSchema
>;

export const M08InterviewTurnResponseSchema = z.object({
  status: z.enum(['EVIDENCE_INGESTED', 'VALIDATION_FAILED']),
  user_id: UserIdSchema,
  evidence_id: EvidenceIdSchema.nullable(),
  gap_closed: GapIdSchema.nullable(),
  remaining_open_gaps: z.number().int().nonnegative(),
  next_phase: z.enum(['DISCOVERY_ACTIVE', 'GATE_C_READY']),
  checkpoint_id: CheckpointIdSchema,
  message: z.string().min(1),
});
export type M08InterviewTurnResponse = z.infer<
  typeof M08InterviewTurnResponseSchema
>;

/**
 * 4. Canonical `M08_Interview_Turn` Record Schema (CF-SPEC-M08-INTERVIEW-V1.0 Section 3 / Invariant G26)
 */
export const M08InterviewTurnContractSchema = z
  .object({
    user_id: UserIdSchema,
    gap_id: GapIdSchema,
    related_claim_id: ClaimIdSchema,
    user_statement: z.string().min(20),
    attribution_confirmed: AttributionScopeSchema,
    temporal_bounds: TemporalBoundsSchema,
    metric_dimension: MetricDimensionSchema,
    verification_origin: z.literal('USER_STATEMENT'),
    status: z.literal('RESOLVED'),
  })
  .strict();
export type M08InterviewTurnContract = z.infer<
  typeof M08InterviewTurnContractSchema
>;
