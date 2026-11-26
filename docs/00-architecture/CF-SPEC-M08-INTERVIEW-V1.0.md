# CareerFlow P01 — Interactive Interview System Architecture Specification (Module M08)

**Document Identifier:** `CF-SPEC-M08-INTERVIEW-V1.0`  
**Document Status:** Architecture Specification / Formally Frozen  
**Governing Baselines:** `CF-ARCH-FREEZE-V1.0`, `PKMRS Runtime System Instruction Kernel v1.0`  
**Primary Execution Model:** Human-Controlled Hybrid (HITL)  
**Integration Boundary:** Browser Extension Client Bridge ↔ Conversational UI ↔ n8n Webhook Engine  
**Target Identity Context:** Single-User Baseline (`USR-0001`) with Multi-User Portability

---

## 1. System Role, Purpose & Boundary Definitions

### 1.1 Objective

The Interactive Interview System (Module M08) provides the conversational clarification surface for Process P01 (Profile Reconstruction & Canonical PSOT Baseline). Its sole function is to interact with candidate `USR-0001` to resolve unanchored dates, unmeasured metrics, ambiguous scopes, and uncertain attributions identified during upstream claim construction (`WF-P01-02` / `M05`) and epistemic gap detection (`WF-P01-03` / `M07`).

### 1.2 Non-Authority & Anti-Hallucination Boundaries

- **Strict Separation of Concerns:** In accordance with `CF-ARCH-FREEZE-V1.0` Section 2, the interview interface maintains conversational dialogue but holds **zero transactional state authority**.
- **No Direct Mutations:** The interview surface shall never write directly to Google Sheets or mutate lifecycle states unilaterally.
- **Invariant G26 Enforcement:** Under invariant **G26**, candidate conversational answers must pass through the identical Claim/Evidence/Verification pipeline. Candidate statements are ingested into Store 2 as `ORIGIN = USER_STATEMENT` evidence; they are never treated as self-evident canonical facts.
- **Scope Isolation:** Module M08 is strictly restricted to resolving historical career facts (P01). It possesses no authority over job tailoring (P04), LinkedIn positioning (P05), networking outreach (P06), or job application execution (P07).

---

## 2. Communication Contracts & Interface Specifications

### 2.1 Endpoint 1: Fetch Next Prioritized Gap

- **Protocol & Endpoint:** `GET /webhook/p01-interview-next`
- **Security & Auth:** Scoped via query parameter `user_id=USR-0001` and shared header token `x-careerflow-token`.
- **Trigger:** Initiated by the client bridge or frontend session.

#### Nominal Response (Open Gaps Pending)

```json
{
  "has_open_gaps": true,
  "user_id": "USR-0001",
  "gap_id": "GAP-0002",
  "gap_type": "METRIC",
  "priority": "CRITICAL",
  "context": {
    "subject": "Frontend application and reusable UI components",
    "related_claim_id": "CLAM-0005",
    "missing_dimension": "Quantitative performance outcomes and scale",
    "scope": "Nexus Logistics GmbH"
  },
  "technical_prompt": "What measurable performance improvements or scale metrics resulted from the UI component library?"
}
```

#### Convergence Response (Queue Exhausted / Ready for Gate C)

```json
{
  "has_open_gaps": false,
  "user_id": "USR-0001",
  "gap_id": null,
  "priority": null,
  "next_phase": "GATE_C_READY",
  "remaining_open_gaps": 0,
  "message": "All critical gaps resolved. Ready for Canonical PSOT synthesis."
}
```

### 2.2 Endpoint 2: Submit Completed Interview Turn

- **Protocol & Endpoint:** `POST /webhook/p01-interview-turn`
- **Headers:** `Content-Type: application/json`, `x-careerflow-token: <SHARED_SECRET>`

#### Request Payload Schema

```json
{
  "user_id": "USR-0001",
  "gap_id": "GAP-0002",
  "related_claim_id": "CLAM-0005",
  "user_statement": "The component library decreased page load latency by 35% across 4 primary internal applications, used by approximately 150 daily active employees.",
  "attribution_confirmed": "INDIVIDUAL_CONTRIBUTION",
  "temporal_bounds": {
    "start_date": "2021-03",
    "end_date": "2023-08",
    "precision": "MONTH"
  },
  "metric_dimension": {
    "value": "35",
    "unit": "PERCENT_LATENCY_REDUCTION",
    "qualifier": "EXACT"
  },
  "timestamp": "2026-10-15T20:30:00.000Z"
}
```

#### Response Payload Schema

```json
{
  "status": "EVIDENCE_INGESTED",
  "user_id": "USR-0001",
  "evidence_id": "EVDS-0013",
  "gap_closed": "GAP-0002",
  "remaining_open_gaps": 11,
  "next_phase": "DISCOVERY_ACTIVE",
  "checkpoint_id": "CHK-EC03-TURN-20261015-E245",
  "message": "Metrics captured and verified. Evidence appended; gap resolved."
}
```

---

## 3. Formal `M08_Interview_Turn` Contract

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "M08_Interview_Turn",
  "type": "object",
  "required": [
    "user_id",
    "gap_id",
    "related_claim_id",
    "user_statement",
    "attribution_confirmed",
    "temporal_bounds",
    "metric_dimension",
    "verification_origin",
    "status"
  ],
  "properties": {
    "user_id": {
      "type": "string",
      "enum": ["USR-0001"]
    },
    "gap_id": {
      "type": "string",
      "pattern": "^GAP-[0-9]{4}$"
    },
    "related_claim_id": {
      "type": "string",
      "pattern": "^CLAM-[0-9]{4}$"
    },
    "user_statement": {
      "type": "string",
      "minLength": 20,
      "description": "Factual, unembellished candidate statement incorporating verified bounds and metrics."
    },
    "attribution_confirmed": {
      "type": "string",
      "enum": [
        "INDIVIDUAL_CONTRIBUTION",
        "TEAM_LEAD",
        "TEAM_MEMBER",
        "SHARED_OWNERSHIP",
        "ORGANIZATION_PROXY"
      ]
    },
    "temporal_bounds": {
      "type": "object",
      "required": ["start_date", "end_date", "precision"],
      "properties": {
        "start_date": { "type": "string" },
        "end_date": { "type": "string" },
        "precision": {
          "type": "string",
          "enum": ["DAY", "MONTH", "YEAR", "QUARTER", "APPROXIMATE", "UNKNOWN"]
        }
      }
    },
    "metric_dimension": {
      "type": "object",
      "required": ["value", "unit", "qualifier"],
      "properties": {
        "value": { "type": "string" },
        "unit": { "type": "string" },
        "qualifier": {
          "type": "string",
          "enum": ["EXACT", "APPROXIMATE", "MORE_THAN", "UP_TO", "NONE"]
        }
      }
    },
    "verification_origin": {
      "type": "string",
      "enum": ["USER_STATEMENT"]
    },
    "status": {
      "type": "string",
      "enum": ["RESOLVED"]
    }
  },
  "additionalProperties": false
}
```

---

## 4. Mandatory Human Gate Alignment & Acceptance Criteria

- **Gate A (M08 Discovery Turn Sign-off):** Candidate retains continuous authority; client bridge never auto-submits without explicit **Confirm & Submit**.
- **Gate C Readiness Transition:** When `remaining_open_gaps == 0`, `WF-P01-03c` sets `WORKFLOW_STATE = 'GATE_C_READY'` and `CONTROL_STATE = 'WAITING_FOR_HUMAN'`.
- **Acceptance Tests:** `ATC-M08-01` (Queue Fetch & Scoping), `ATC-M08-02` (Probing Quality), `ATC-M08-03` (Schema Compliance), `ATC-M08-04` (Evidence Persistence), `ATC-M08-05` (Convergence Transition).

**Specification Identifier:** `CF-SPEC-M08-INTERVIEW-V1.0`  
**Status:** `FROZEN`
