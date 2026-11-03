# CareerFlow

**Distributed AI Workflow Engine & Career Intelligence System**

CareerFlow is a structured, AI-powered career intelligence platform designed to manage the complete professional journey — from professional knowledge management to targeted job applications and relationship orchestration.

## Architecture Baseline

The system architecture and specifications are formally frozen, including:

- **7-Module Lifecycle (P00–P07):** A complete end-to-end career management process.
- **System Invariants (G01–G32):** Architectural and operational constraints.
- **Physical JSON Schemas:** Draft-07 schemas defining the system's data contracts.

## Implementation Status

The codebase is currently in **Phase 1: Foundational Scaffolding**.

| Component | Status |
|---|---|
| Monorepo & Workspace Setup | In Progress |
| Contracts Package | Planned / In Design |
| Web Application | Planned / In Design |
| Supabase Integration | Planned / In Design |
| Workflow Orchestration | Planned / In Design |
| AI Execution Layer | Planned / In Design |

## Technology Stack

- **Frontend:** React, TypeScript, Vite
- **Backend & Database:** Supabase (PostgreSQL)
- **Workflow Orchestration:** n8n
- **AI Execution:** Gemini API
- **Monorepo Management:** pnpm Workspaces

## Repository Structure

    careerflow/
    ├── apps/
    │   └── web/
    ├── packages/
    │   └── contracts/
    ├── docs/
    ├── workflows/
    ├── ai/
    └── supabase/

## Development Principles

- Strict separation of client-side and server-side secrets.
- Contract-driven architecture.
- Human-in-the-loop (HITL) governance.
- Traceability and provenance.
- Modular and reusable workflow design.