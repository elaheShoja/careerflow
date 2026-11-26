# ADR-0001: Multi-Provider AI Abstraction & Capability-Based Routing

- **Status:** Accepted
- **Date:** 2026-11-26
- **Owner:** Elahe Shoja
- **Architecture Reference:** CF-ARCH-FREEZE-V1.0 (Principle 4.5 — Vendor Independence; Layer 6 — AI / Research / Execution Layer)

## Context

CareerFlow executes heterogeneous AI tasks across its 7-module lifecycle (`P01–P07`), including deterministic claim decomposition, contradiction auditing, structured gap detection, company/people intelligence synthesis, and document drafting. While Gemini is the initial active provider in V1, binding business logic, prompts, or orchestration workflows to a single AI vendor creates lock-in, prevents per-task capability optimization, and exposes pipelines to single-provider rate limits or outages.

## Decision

CareerFlow enforces strict **AI provider independence** across all layers (`apps/web`, `packages/contracts`, `ai/`, `workflows/`, and `supabase/`):

1. **Capability-Based Task Routing:**
   - Processes (`P01–P07`) and Execution Contracts (`EC-01`–`EC-07`) MUST request AI execution by **capability profile** (e.g., `structured-extraction`, `epistemic-audit`, `synthesis-drafting`, `classification`) rather than hardcoding a vendor or model identifier inside process logic.
   - Provider and model selection is resolved externally via configuration (`ai/routing-policy.json` / P00 configuration store), allowing different providers (e.g., Gemini, Anthropic Claude, OpenAI) to serve different modules or fallback chains.

2. **Provider-Neutral Kernels & Prompts:**
   - System instruction kernels (`ai/kernels/`) and prompt templates (`ai/prompts/`) MUST be authored in provider-neutral Markdown with explicit role, epistemic boundary, and governance invariant (`G01–G32`) instructions.
   - Vendor-specific wrapper syntax, proprietary tool-calling schemas, or SDK-coupled formatting MUST NOT be embedded inside canonical prompt definitions.

3. **Contract-First Output Validation:**
   - Every AI response that mutates or informs system state MUST be validated against an authoritative **Zod / Draft-07 JSON Schema** defined in `@careerflow/contracts` before downstream state transitions occur.
   - Provider adapters normalize raw vendor responses into a unified internal envelope (`{ provider, model, capability, payload, usage, traceId }`).

4. **Strict Server-Side Credential Isolation:**
   - All AI provider API keys (`GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`) are restricted exclusively to server-side runtimes and workflow orchestrators (`.env.server`), never exposed to client bundles (`apps/web`).

## Consequences

- **Positive:**
  - Any module (`P01–P07`) can switch between Gemini, Claude, OpenAI, or future providers via configuration without modifying domain contracts or prompt logic.
  - Enables task-specific model pairing (e.g., pairing high-precision reasoning models for `EC-04` contradiction detection with fast structured-output models for `EC-02` claim extraction) and automatic provider failover.
- **Trade-offs:**
  - Prompts cannot rely on proprietary, single-vendor features unless encapsulated behind an adapter capability flag.
  - Requires maintaining normalized provider adapters in the execution/orchestration layer.
