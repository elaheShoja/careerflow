# CareerFlow

**Distributed AI Workflow Engine & Career Intelligence System**

CareerFlow is a structured, AI-powered career intelligence platform designed to manage the complete professional journey — from professional knowledge management to targeted job applications and relationship orchestration.

## Architecture Baseline

The system architecture and specifications are formally frozen, including:

- **7-Module Lifecycle (P00–P07):** A complete end-to-end career management process.
- **System Invariants (G01–G32):** Architectural and operational constraints.
- **Multi-Provider AI Abstraction (`ADR-0001`):** Capability-based routing across Gemini, Anthropic Claude, and OpenAI with strict schema validation.
- **Physical JSON Schemas:** Draft-07 schemas defining the system's data contracts.

## Implementation Status

The codebase is currently transitioning from **Milestone 1.2A (Baseline Specs & Multi-Provider AI Setup)** to **Milestone 1.2B (`@careerflow/contracts`)**.

| Component                                                   | Status              |
| ----------------------------------------------------------- | ------------------- |
| Monorepo & Workspace Setup (Milestone 1.1)                  | Completed           |
| Baseline Specs, AI Kernel & Routing Policy (Milestone 1.2A) | Completed           |
| Contracts Package (`@careerflow/contracts`, Milestone 1.2B) | Next Up             |
| Web Application (`apps/web`)                                | Shell Ready         |
| Supabase Integration (`supabase/`)                          | Config Ready        |
| Workflow Orchestration (`workflows/`)                       | Ready for Migration |

## Technology Stack

- **Frontend:** React, TypeScript, Vite
- **Backend & Database:** Supabase (PostgreSQL) / Google Workspace (V1 Operational Store)
- **Workflow Orchestration:** n8n
- **AI Execution:** Provider-Agnostic Gateway (Gemini, Anthropic Claude, OpenAI)
- **Monorepo Management:** pnpm Workspaces

## Repository Structure

```text
careerflow/
├── apps/
│   └── web/
├── packages/
│   └── contracts/
├── docs/
│   ├── 00-architecture/
│   ├── 01-processes/
│   ├── 02-contracts/
│   └── 03-adrs/
├── workflows/
│   ├── master/
│   └── sub-workflows/
├── ai/
│   ├── kernels/
│   └── prompts/
└── supabase/
```

## Development Principles

- Strict separation of client-side and server-side secrets.
- AI provider independence via capability-based routing (`ADR-0001`).
- Contract-driven architecture.
- Human-in-the-loop (HITL) governance.
- Traceability and provenance.
- Modular and reusable workflow design.
