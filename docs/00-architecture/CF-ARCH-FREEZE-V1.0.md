# CareerFlow Architecture Baseline & Freeze Document — V1.0

**Document Identifier:** `CF-ARCH-FREEZE-V1.0`  
**Status:** Architecture Baseline / Formally Frozen  
**Target Scope:** Process P01 (Profile Reconstruction & Canonical Master Resume Baseline) + Cross-Process Foundation (P02–P07 Ready)  
**Primary Execution Model:** Human-Controlled Hybrid (HITL)  
**Implementation Mode:** Single-User Operational Deployment (`USR-0001`) with Multi-User Forward Compatibility

---

## 1. Executive Architectural Summary

CareerFlow V1.0 establishes an evidence-backed, governance-controlled Career Operating System. The architecture strictly isolates the **Conversational Presentation & Cognitive Clarification Layer** from the **Deterministic State Machine, Validation Ledger, & Orchestration Layer**.

The runtime is divided into three concrete systems:

1. **Frontend / Conversational Surface:** The dedicated **CareerFlow Gem** (Gemini-native interface) acting as the candidate-facing cognitive interviewer, process guide, and gate presenter.
2. **Orchestration & Validation Engine:** **n8n**, executing deterministic business logic, invariant enforcement (G01–G32), Google Drive/Sheets I/O, file parsing, and state ledger persistence.
3. **Operational Storage Layer:** **Google Drive** (unstructured documents, artifacts, evidence files) and **Google Sheets** (structured operational relational database), structured to support direct migration to **Supabase (PostgreSQL)** without domain redesign.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                            CANDIDATE / USER                            │
└───────────────────▲────────────────────────────────┬───────────────────┘
                    │                                │
   Conversational Prompts /           Natural Language Responses /
      Review Summaries                  Command Directives ('START')
                    │                                │
                    ▼                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         CAREERFLOW GEM (M08 UI)                        │
│  • Cognitive Candidate Interviewer & Gap Formulator                    │
│  • Contextual Normalizer (Dates, Metrics, Attribution)                 │
│  • Human Gate Presenter (Gates A, B, C, D)                             │
│  • Context Scope: Bound to Active Session & USER_ID                    │
└───────────────────▲────────────────────────────────┬───────────────────┘
                    │                                │
     JSON Payloads / Status Reports     JSON Payloads / Turn Answers
          (Webhook Responses)                (Webhook Requests)
                    │                                │
                    ▼                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           n8n ORCHESTRATION                            │
│  • Deterministic Execution Contracts (EC-01 through EC-08)             │
│  • Invariant Enforcer & Epistemic Guard (G01–G32)                      │
│  • State Machine Controller (RUNTIME_STATE ledger)                     │
│  • Change Impact Tracker (CHANGE_LOG ledger)                           │
│  • Storage & API Bridge (Google Drive, Google Sheets, AI Providers)    │
└──────────────▲─────────────────────────────────────────────┬───────────┘
               │                                             │
               │ Relational Ledger Reads/Writes              │ File Storage I/O
               ▼                                             ▼
┌───────────────────────────────┐             ┌────────────────────────────┐
│         GOOGLE SHEETS         │             │        GOOGLE DRIVE        │
│ (Operational Structured DB)   │             │  (Document / Artifact DB)  │
│  • User-Scoped Entity Tables  │             │  • Intake (Raw Sources)    │
│  • System Configuration       │             │  • Derived Master Resumes  │
│  • Immutable Audit Ledgers    │             │  • Evidence Cache          │
└───────────────────────────────┘             └────────────────────────────┘
```

---

## 2. Gem vs. n8n Role Allocation & Boundary Enforcement

To prevent hallucination of state and loss of audit traceability, boundaries are frozen as follows:

### 2.1 The CareerFlow Gem (Conversational & Cognitive Boundary)

The Gem is strictly a stateless client to the orchestration engine, maintaining session dialogue while deferring all state authority to n8n.

**Responsibilities:**

- **Intake Guidance:** Guiding the user on what documents to place in their designated Google Drive folder and accepting the kickoff directive (`START`).
- **Interactive Candidate Interview (Module M08):** Ingesting structured question requirements from n8n and phrasing them as natural, contextual, professional interview questions.
- **Turn Answer Capture:** Collecting candidate answers, asking immediate contextual follow-ups if answers are vague, and sending normalized responses to n8n via webhook.
- **Gate Presentation:** Rendering human-readable summaries of candidate items for approval gates (Gate A: Discovery, Gate B: Conflicts, Gate C: PSOT Promotion, Gate D: Master Resume Sign-off).

**Strict Prohibitions:**

- **No Direct Database Writes:** The Gem shall never directly mutate rows in Google Sheets or Supabase.
- **No State Fabrication:** The Gem shall never unilaterally advance a lifecycle or workflow state.
- **No Invariant Bypassing:** The Gem shall never silently resolve contradictions or synthesize unverified career claims into canonical facts (violating G01, G16, G18).

### 2.2 n8n (Deterministic Orchestration & State Boundary)

n8n is the sole transactional authority, executing deterministic workflow contracts and state mutations.

**Responsibilities:**

- **Document Processing:** Polling or reading the Google Drive intake folder, executing text/OCR extraction from files, and populating `SOURCES`.
- **Decomposition & Synthesis:** Invoking AI parsing calls via explicit prompts/APIs to generate `CLAIMS`, `EVIDENCE`, `GAPS`, and `CONFLICTS`.
- **Ledger Enforcement:** Enforcing monotonic progress, gap/conflict counters, and immutability across `RUNTIME_STATE` (14 columns) and `CHANGE_LOG` (9 columns).
- **Convergence Checking:** Computing whether open critical gaps equal zero before releasing Gate C/D transitions.
- **Artifact Compilation:** Assembling approved `REPRESENTATIONS` rows into formatted document files (Markdown/PDF) and persisting them to Google Drive Store 4.

---

## 3. The Identity & Multi-User Model (`USER_ID`)

### 3.1 Single-User V1 Baseline

- V1 executes against one authorized user identity: **`USR-0001`**.
- All workflows, webhook contracts, and data records must explicitly declare and consume `USER_ID = "USR-0001"`. Hardcoding ad-hoc user strings or omitting user scoping from entity rows is strictly prohibited.

### 3.2 Table Scoping Classification

Tables within the operational database are classified into two structural categories:

```text
Operational Database Tables
├── User-Scoped Entity Tables (Require USER_ID column)
│   ├── SOURCES
│   ├── EVIDENCE
│   ├── CLAIMS
│   ├── GAPS
│   ├── CONFLICTS
│   ├── CAREER_PROFILE
│   ├── SKILLS
│   ├── REPRESENTATIONS
│   ├── CHANGE_LOG
│   └── RUNTIME_STATE
└── System-Level Tables (Shared across all users)
    ├── CONFIGURATION
    └── USERS (Master Identity Registry)
```

### Detailed Table Specifications

**1. `USERS` — System Identity Registry**

Columns:

`USER_ID`, `FULL_NAME`, `PRIMARY_EMAIL`, `PRIMARY_MARKET`, `STATUS`, `CREATED_AT`

V1 pre-seeded user:

`USR-0001 | Elahe Shoja | elaheshoja.p@gmail.com | Germany | ACTIVE | 2026-10-01T00:00:00.000Z`

**2. User-Scoped Operational Tables**

Every record in the following tables must possess a `USER_ID` column referencing `USERS.USER_ID`:

- `SOURCES`: `SOURCE_ID`, `USER_ID`, `SOURCE_TYPE`, ...
- `EVIDENCE`: `EVIDENCE_ID`, `USER_ID`, `SOURCE_ID`, ...
- `CLAIMS`: `CLAIM_ID`, `USER_ID`, `CLAIM_TYPE`, `SUBJECT`, ...
- `GAPS`: `GAP_ID`, `USER_ID`, `GAP_TYPE`, `SCOPE`, ...
- `CONFLICTS`: `CONFLICT_ID`, `USER_ID`, `CONFLICT_TYPE`, ...
- `CAREER_PROFILE`: `PSOT_ID`, `USER_ID`, `ENTITY_TYPE`, ...
- `SKILLS`: `SKILL_ID`, `USER_ID`, `SKILL_NAME`, ...
- `REPRESENTATIONS`: `REPRESENTATION_ID`, `USER_ID`, `RESUME_VERSION`, ...
- `CHANGE_LOG`: `CHANGE_ID`, `USER_ID`, `RECORD_ID`, `CHANGE_TYPE`, ...
- `RUNTIME_STATE`: `CHECKPOINT_ID`, `USER_ID`, `LIFECYCLE_STATE`, `WORKFLOW_STATE`, ...

**3. Record-ID Compatibility Rule**

Existing record ID schemas remain intact:

`SRCE-XXXX`, `EVDS-XXXX`, `CLAM-XXXX`, `GAP-XXXX`, `PROF-XXXX`, `SKIL-XXXX`, `REPR-XXXX`, `CHG-XXXX`, `CKPT-XXXX`

`USER_ID` is added as an independent scoping attribute. It does not replace the stable entity primary keys.

---

## 4. Google Drive User-Scoped Storage Structure

All unstructured artifacts, raw source documents, and rendered outputs must be housed within a deterministic, user-isolated directory tree:

```text
Google Drive Root
└── CareerFlow/
    └── Users/
        └── USR-0001/
            ├── Store_1_Intake/
            ├── Store_1_Archive/
            ├── Store_2_Evidence_Working/
            ├── Store_3_PSOT_Snapshots/
            └── Store_4_Master_Resumes/
```

**Access Control & Scoping:**

Workflows operating on behalf of `USR-0001` resolve directory paths dynamically using:

`CareerFlow/Users/{USER_ID}/Store_1_Intake/`

This ensures that when `USR-0002` is introduced, workflow logic does not need to be redesigned.

---

## 5. Gem ↔ n8n Communication Boundary Contract

Communication between the CareerFlow Gem and n8n takes place over authenticated HTTPS webhooks passing strictly typed JSON payloads.

### 5.1 Process Initiation

**Endpoint:** `POST /webhook/p01-initiate`

**Triggered by:** Gem receiving the `START` command after the candidate confirms file staging.

Example payload:

```json
{
  "user_id": "USR-0001",
  "command": "START",
  "timestamp": "2026-10-07T12:00:00.000Z"
}
```

Example response:

```json
{
  "status": "PROCESSING_STARTED",
  "user_id": "USR-0001",
  "checkpoint_id": "CKPT-3200",
  "sources_detected": 3,
  "message": "Intake completed. Analyzing documents for evidence decomposition."
}
```

### 5.2 Interview Question Fetch

**Endpoint:** `GET /webhook/p01-interview-next?user_id=USR-0001`

Example response:

```json
{
  "has_open_gaps": true,
  "user_id": "USR-0001",
  "gap_id": "GAP-0002",
  "gap_type": "METRIC",
  "context": {
    "subject": "Frontend application and reusable UI components",
    "related_claim_id": "CLAM-0005",
    "missing_dimension": "Quantitative performance outcomes and scale"
  },
  "technical_prompt": "What measurable performance improvements or scale metrics resulted from the UI component library?"
}
```

### 5.3 Interview Turn Submit

**Endpoint:** `POST /webhook/p01-interview-turn`

Example payload:

```json
{
  "user_id": "USR-0001",
  "gap_id": "GAP-0002",
  "user_statement": "The component library decreased page load latency by 35% across 4 primary internal applications, used by approximately 150 daily active employees.",
  "attribution_confirmed": "INDIVIDUAL_CONTRIBUTION",
  "timestamp": "2026-10-07T12:05:00.000Z"
}
```

Example response:

```json
{
  "status": "EVIDENCE_INGESTED",
  "user_id": "USR-0001",
  "gap_closed": "GAP-0002",
  "remaining_open_gaps": 0,
  "next_phase": "GATE_C_READY",
  "message": "Metrics captured and verified. All critical gaps resolved. Ready for Canonical PSOT synthesis."
}
```

---

## 6. End-to-End Operational P01 Flow

```text
[Candidate]
  │
  ├─► 1. Drops CV, certificates, project docs into:
  │      CareerFlow/Users/USR-0001/Store_1_Intake/
  │
  ├─► 2. Sends "START" in CareerFlow Gem
  │
[CareerFlow Gem]
  │
  ├─► 3. Issues POST /webhook/p01-initiate
  │
[n8n Orchestration Engine]
  │
  ├─► 4. Scans intake, extracts text, registers SOURCES
  ├─► 5. Decomposes text into CLAIMS and EVIDENCE
  ├─► 6. Evaluates gaps and contradictions
  │
  ├─► 7. Interactive Interview Loop (M08)
  │      ├─ n8n identifies next prioritized GAP
  │      ├─ Gem formulates the interview question
  │      ├─ Candidate answers in Gem
  │      ├─ Gem submits answer to n8n
  │      ├─ n8n processes answer under G26
  │      └─ Loop continues until critical gaps are resolved
  │
  ├─► 8. Conflict resolution under Gate B
  ├─► 9. Canonical PSOT synthesis into CAREER_PROFILE & SKILLS
  ├─► 10. Representation derivation into REPRESENTATIONS
  ├─► 11. Gate D validation and human sign-off
  ├─► 12. Master Resume rendering
  │       └─► Store_4_Master_Resumes/
  │
  └─► 13. Lifecycle finalization
          └─► COMPLETED / IDLE
```

---

## 7. Operational Distinction: Test Slice vs. Operational Target

| Architectural Dimension | P01 Test Slice — Completed        | P01 Operational Target — To Be Assembled |
| ----------------------- | --------------------------------- | ---------------------------------------- |
| Execution Trigger       | Manual `Test workflow` in n8n     | `START` in CareerFlow Gem via webhook    |
| Input Source            | Single synthetic CV text file     | Dynamic multi-document Drive intake      |
| Interview Loop          | Mocked/pre-seeded transitions     | Live multi-turn M08 interview            |
| Workflow Coupling       | 8 disconnected unit workflows     | Master Orchestrator + sub-workflows      |
| Master Resume Artifact  | Structured `REPRESENTATIONS` rows | Rendered Markdown/PDF in Drive           |
| User Identity           | Implicit single-user execution    | Explicit `USER_ID = USR-0001`            |

---

## 8. Multi-User & Supabase Migration Principles

1. **Relational Symmetry:** Google Sheets column names use PostgreSQL-compatible naming conventions.
2. **Zero In-Sheet Logic:** n8n performs explicit user-scoped filtering rather than relying on spreadsheet formulas.
3. **Partitioned File Storage:** User files are stored under `/Users/{USER_ID}/`, allowing direct migration to Supabase Storage or equivalent object storage.
4. **Stateless Conversational Layer:** The Gem stores no authoritative database state. Multi-user scaling is achieved through authenticated session context resolving to `USER_ID`.

---

## 9. Implementation Roadmap to Operational V1

### Phase 1 — Foundation Scoping

- Add `USER_ID` to all user-scoped operational Sheets.
- Seed the `USERS` registry.
- Provision the user-scoped Google Drive directory structure.

### Phase 2 — Ingestion & Document Parser

- Build the Intake Watcher workflow.
- Scan Drive Intake.
- Extract document text/OCR.
- Register sources in `SOURCES`.

### Phase 3 — Interactive Interview Subsystem

- Implement n8n webhook endpoints for M08.
- Process candidate answers under G26.
- Update evidence and gap state deterministically.

### Phase 4 — Document Rendering Engine

- Build the Master Resume compiler.
- Read approved `REPRESENTATIONS`.
- Generate Markdown/PDF.
- Commit output to Store 4.

### Phase 5 — Master Orchestrator & Gem Binding

- Link EC workflows into an end-to-end pipeline.
- Configure CareerFlow Gem webhook tools.
- Enable the Gem to initiate and drive the operational P01 lifecycle.

---

## 10. Formal Architecture Freeze Declaration

The following architectural decisions are formally frozen:

- The role allocation between **CareerFlow Gem** and **n8n**.
- The `USER_ID` data-scoping model.
- The user-scoped Google Drive structure.
- The distinction between conversational responsibility and transactional authority.
- The 14-column `RUNTIME_STATE` structure.
- The 9-column `CHANGE_LOG` structure.
- The requirement that no workflow bypass the epistemic boundaries and invariants **G01–G32**.
- The five-phase roadmap toward the operational P01 system.

**Document Status:** `FROZEN — V1.0`  
**Document Identifier:** `CF-ARCH-FREEZE-V1.0`
