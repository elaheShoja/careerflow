import { z } from 'zod';
import { IsoTimestampSchema, UserIdSchema } from '../common/ids-and-enums.js';

/**
 * Supported AI Providers (ADR-0001)
 */
export const AiProviderSchema = z.enum(['gemini', 'anthropic', 'openai']);
export type AiProvider = z.infer<typeof AiProviderSchema>;

/**
 * Capability Profiles for Task-Based Routing (ADR-0001)
 */
export const AiCapabilitySchema = z.enum([
  'structured-extraction',
  'epistemic-audit',
  'synthesis-drafting',
  'classification',
]);
export type AiCapability = z.infer<typeof AiCapabilitySchema>;

/**
 * Routing Policy Contract (matches ai/routing-policy.example.json)
 */
export const AiProviderConfigSchema = z.object({
  enabled: z.boolean(),
  apiKeyEnv: z.string().min(1),
  defaultModelEnv: z.string().min(1),
  fallbackModel: z.string().min(1),
  supportsStrictJsonSchema: z.boolean(),
});
export type AiProviderConfig = z.infer<typeof AiProviderConfigSchema>;

export const AiCapabilityRoutingRuleSchema = z.object({
  description: z.string().min(1),
  primaryProvider: AiProviderSchema,
  fallbackProvider: AiProviderSchema,
  temperature: z.number().min(0).max(2),
});
export type AiCapabilityRoutingRule = z.infer<
  typeof AiCapabilityRoutingRuleSchema
>;

export const AiTaskBindingSchema = z.object({
  name: z.string().min(1),
  capability: AiCapabilitySchema,
  kernel: z.string().min(1).nullable(),
});
export type AiTaskBinding = z.infer<typeof AiTaskBindingSchema>;

export const AiRoutingPolicySchema = z.object({
  $schema: z.string().optional(),
  version: z.string().min(1),
  governance: z.object({
    adrReference: z.literal('ADR-0001'),
    enforceStructuredJsonOutput: z.boolean(),
    rejectRawMarkdownFences: z.boolean(),
    allowProviderFallback: z.boolean(),
  }),
  providers: z.record(AiProviderSchema, AiProviderConfigSchema),
  capabilities: z.record(AiCapabilitySchema, AiCapabilityRoutingRuleSchema),
  taskBindings: z.record(z.string().min(1), AiTaskBindingSchema),
});
export type AiRoutingPolicy = z.infer<typeof AiRoutingPolicySchema>;

/**
 * Normalized AI Execution Request (Provider-Agnostic Input)
 */
export const AiExecutionRequestSchema = z.object({
  traceId: z.string().min(1),
  userId: UserIdSchema,
  taskKey: z.string().min(1),
  capability: AiCapabilitySchema,
  kernelPath: z.string().min(1).nullable().optional(),
  systemInstruction: z.string().min(1),
  userPrompt: z.string().min(1),
  preferredProvider: AiProviderSchema.optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxOutputTokens: z.number().int().positive().optional(),
});
export type AiExecutionRequest = z.infer<typeof AiExecutionRequestSchema>;

/**
 * Normalized Token & Latency Telemetry
 */
export const AiUsageMetricsSchema = z.object({
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
  latencyMs: z.number().nonnegative(),
});
export type AiUsageMetrics = z.infer<typeof AiUsageMetricsSchema>;

/**
 * Normalized AI Execution Envelope (ADR-0001 Section 3)
 * Wraps validated structured payloads returned by any provider adapter.
 */
export const createAiExecutionEnvelopeSchema = <TPayload extends z.ZodTypeAny>(
  payloadSchema: TPayload,
) =>
  z.object({
    traceId: z.string().min(1),
    userId: UserIdSchema,
    taskKey: z.string().min(1),
    capability: AiCapabilitySchema,
    provider: AiProviderSchema,
    model: z.string().min(1),
    usedFallback: z.boolean(),
    payload: payloadSchema,
    usage: AiUsageMetricsSchema,
    completedAt: IsoTimestampSchema,
  });

export interface AiExecutionEnvelope<TPayload> {
  traceId: string;
  userId: z.infer<typeof UserIdSchema>;
  taskKey: string;
  capability: AiCapability;
  provider: AiProvider;
  model: string;
  usedFallback: boolean;
  payload: TPayload;
  usage: AiUsageMetrics;
  completedAt: z.infer<typeof IsoTimestampSchema>;
}
