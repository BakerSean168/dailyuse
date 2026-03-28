# DailyUse AI Python Integration Implementation Plan

Status: Active Implementation Update  
Date: 2026-03-27  
Scope: `dailyuse` monorepo AI architecture, implementation phases, and rollout strategy

## 1. Document Purpose

This document defines the recommended architecture and implementation plan for introducing a Python AI service into the `dailyuse` monorepo.

The goal is not to replace the existing TypeScript AI module wholesale. The goal is to:

1. Keep the existing TypeScript module as the public business boundary.
2. Introduce Python as the execution engine for heavy AI capabilities.
3. Reuse existing domain modules, persistence rules, repository storage, and PowerSync integration.
4. Roll out incrementally so the project keeps shipping while AI capabilities become materially stronger.

This plan is based on the current repository structure and runtime wiring, not on a greenfield assumption.

### 2.3 Implementation Status Update (2026-03-27)

Current implementation status in the repository:

1. Phase 0 through Phase 4 are implemented.
2. Phase 5 is partially implemented:
   - repository-backed knowledge indexing exists
   - retrieval returns citations
   - resource create or update now auto-triggers knowledge reindexing
   - grounded knowledge expansion now flows through the TS boundary and AI floating panel for cited draft refinement
   - indexed resources now persist embeddings and use hybrid lexical plus vector retrieval
   - provider-backed embeddings are now attempted on Python indexing paths, including query-triggered sync, draft expansion, manual reindex, and repository-mutation auto reindex, with local deterministic fallback when the upstream provider does not support embeddings
   - Python citation ranking now chooses a query embedding that matches each resource or chunk dimension, so provider-sized embeddings are usable during retrieval instead of collapsing to zero similarity
   - server-side Prisma storage now has a dedicated `AiKnowledgeIndexEntry` table instead of relying only on repository resource metadata
   - TS knowledge sync now asks the knowledge index repository for indexed candidates first, then hydrates repository content only for those hits or for fallback resources
   - server-side Prisma retrieval now has an optional `pgvector` candidate-recall path backed by a dedicated `retrieval_vector` column and IVFFlat index, with automatic fallback when the extension or migration is unavailable
   - AI capabilities now expose knowledge-index diagnostics so the current persistence backend and vector-recall mode are visible instead of being hidden behind fallback behavior
   - desktop and PowerSync paths still retain metadata-backed persistence and fallback behavior
   - desktop-side ANN retrieval and a fully separate vector database are still not implemented
3. Phase 6 is implemented as controlled analytics Q&A rather than unrestricted SQL generation.
4. Phase 7 is implemented with plan-first, confirm-before-side-effects automation.
5. Phase 8 is intentionally remote-backed today. Local desktop Python runtime is not implemented.
6. Phase 12 is partially implemented:
   - request tracing, provider or model tagging, error classification, deterministic evals, live-provider evals, history archiving, quality gates, and basic cost estimation are in place
   - evaluation report surfacing now exists through the TS AI boundary, HTTP and IPC transports, and the shared AI floating panel, so latest deterministic and live reports plus recent history are visible in web and desktop
   - broader quality monitoring and richer cost visibility are still being completed

## 2. Current State Summary

The repository already has a meaningful AI architecture. This matters because the Python service must fit the existing system instead of bypassing it.

### 2.1 Existing Facts

1. The API runtime registers AI as a first-class module in `apps/api/src/main.ts`.
2. The desktop runtime also registers AI as a first-class module in `packages/ai/src/electron-entry/index.ts`.
3. The shared UI already exposes AI entry points in `packages/app-vue/src/modules/ai/components/AIFloatingBall.vue`:
   - Generate Goal
   - AI Chat
   - Create Knowledge Note
   - Expand Draft With Knowledge
   - Ask Knowledge Base
   - Ask Analytics
4. AI provider configuration, conversation storage, message storage, and generation task tables already exist in the shared database schema.
5. AI-related tables are already part of the PowerSync projection surface.
6. Knowledge notes are already persisted through the repository module application boundary instead of bypassing repository rules.

### 2.2 Important Consequences

1. AI is already a system module, not an isolated experiment.
2. The current public API surface should be preserved where possible.
3. Desktop is a real constraint. A Python plan that only works for the web runtime is incomplete.
4. Repository remains the source of truth for knowledge note files.
5. Provider secrets and user identity already have a home in the TypeScript side of the system.

## 3. Core Architectural Decision

The recommended design is:

- Keep `@dailyuse/ai` as the public orchestration and business boundary.
- Add `apps/ai-service` as an internal AI execution service.
- Keep web and desktop clients talking to the existing TypeScript-facing contracts.
- Move model-heavy and retrieval-heavy capabilities into Python progressively.

In short:

```text
UI -> existing TS clients/adapters -> existing API/IPC boundary -> TS orchestration -> Python AI engine
```

This is the most pragmatic path because it preserves:

- current contracts
- current auth behavior
- current provider configuration ownership
- current repository persistence path
- current PowerSync-based data flow
- current desktop integration model

## 4. Target Architecture

### 4.1 High-Level Runtime View

```text
apps/web / apps/desktop
  -> @dailyuse/ai application-client
  -> HTTP API or Electron IPC
  -> TypeScript AI orchestration layer
  -> internal AI execution adapter
      -> apps/ai-service (FastAPI)
      -> LLM provider calls
      -> embeddings
      -> RAG retrieval
      -> structured outputs
      -> agent workflows
      -> eval logic
  -> TypeScript business module tools
      -> goal
      -> task
      -> repository
      -> setting
      -> dashboard or analytics helpers
```

### 4.2 Responsibility Split

TypeScript remains responsible for:

- public API routes
- desktop IPC handlers
- authentication and identity context
- provider CRUD and default provider selection
- provider secret storage and decryption
- conversation and message persistence
- repository-backed note creation
- business tool execution
- outward-facing DTO contracts

Python becomes responsible for:

- prompt orchestration
- structured output generation
- tool selection and reasoning
- chunking and embeddings
- vector search and reranking
- knowledge expansion pipelines
- controlled database-answer planning
- evaluation and quality scoring

### 4.3 Why Python Should Not Own Everything

If Python owns everything immediately, the system pays a large migration cost:

1. Web and desktop runtime behavior diverge.
2. Existing TS module abstractions become dead weight.
3. Secret management gets duplicated.
4. Repository writes risk bypassing business boundaries.
5. Desktop local mode becomes much harder to support.

Therefore Python should be introduced as a capability engine behind an adapter seam, not as a replacement frontend/backend boundary.

## 5. Recommended Boundary Design

### 5.1 New Internal Port on the TypeScript Side

The TypeScript AI module should gain an internal execution port conceptually similar to:

- `ChatExecutionPort`
- `GoalPlanningPort`
- `KnowledgeIngestionPort`
- `KnowledgeQueryPort`
- `AnalyticsQueryPort`

The initial implementation can be a single internal adapter that talks to Python over HTTP. Later, the ports can split if the flows become complex.

### 5.2 Public API Boundary Remains Stable

The following public surfaces should remain TypeScript-owned:

- `/api/v1/ai/providers/*`
- `/api/v1/ai/chat/*`
- `/api/v1/ai/generate/*`
- `/api/v1/ai/knowledge-notes/*`
- Electron AI IPC handlers

This lets the UI remain stable while the internal execution mechanism evolves.

### 5.3 Internal Service Boundary

Python should expose internal-only endpoints such as:

- `GET /healthz`
- `POST /internal/chat/complete`
- `POST /internal/chat/stream`
- `POST /internal/goals/plan`
- `POST /internal/knowledge/generate-note`
- `POST /internal/knowledge/index-resource`
- `POST /internal/knowledge/query`
- `POST /internal/analytics/query`

These endpoints are not public product APIs. They are internal service contracts.

## 6. Service-to-Service Communication

### 6.1 Recommended Request Flow

```text
User request
  -> Node API authenticates user
  -> Node resolves identity, provider, permissions, relevant domain context
  -> Node calls Python internal endpoint
  -> Python returns stream or structured output
  -> Node persists product-facing state changes
  -> Node returns final response to UI
```

### 6.2 Service Authentication

Python should not validate end-user JWTs as its primary auth mechanism.

Recommended approach:

1. Node remains the end-user authentication boundary.
2. Node sends a service-authenticated request to Python.
3. Node passes normalized identity context in request metadata.
4. Python trusts only internal callers with the service credential.

Recommended headers:

- `X-Internal-Service`
- `X-Internal-Timestamp`
- `X-Internal-Content-SHA256`
- `X-Internal-Signature`
- `X-Request-Id`
- `X-Identity-Id`

### 6.3 Provider Secret Handling

For phase 1 and phase 2, provider secrets should remain TypeScript-owned.

Recommended flow:

1. User stores provider config through existing TS provider APIs.
2. TS decrypts the API key only when needed.
3. TS forwards the resolved provider runtime config to Python for execution.

This avoids giving Python full ownership of provider-secret persistence before the architecture is stable.

## 7. Feature Architecture by Capability

## 7.1 Chat

### Target Behavior

- conversation history persists in existing AI tables
- UI gets streaming output
- provider selection remains compatible with existing settings
- assistant output can eventually call tools

### Recommended Design

1. Node API remains the chat entrypoint.
2. Node loads and validates the conversation.
3. Node persists the user message first.
4. Node forwards normalized history and provider runtime config to Python.
5. Python streams assistant tokens or chunks back.
6. Node relays the stream to the UI.
7. Node persists the final assistant message after stream completion.

### Why This Split

- conversation state stays in the existing domain
- UI contract remains stable
- Python focuses on inference
- persistence and audit stay on the TS side

## 7.2 Goal Decomposition and Goal Execution

### Target Behavior

The user should be able to request:

- a goal draft
- key result suggestions
- task template suggestions
- eventual direct creation of goal-related entities

### Recommended Rollout

Phase 1:

- Python returns a structured goal plan only.
- TS returns it to the existing UI and lets the user confirm edits.

Phase 2:

- Python selects from allowed tools.
- TS executes those tools against existing goal/task module application services.

### Rule

Python should not directly insert domain rows into goal/task tables in the early phases.

TS tool execution should remain the path for:

- goal creation
- key result creation
- task template creation
- relationship validation

## 7.3 Knowledge Note Generation

### Existing Strength to Preserve

Knowledge notes already go through repository persistence adapters rather than direct file writes from AI code. That is correct and should remain true.

### Recommended Design

1. The UI calls the existing TypeScript route.
2. TS resolves the effective note subpath from settings.
3. TS calls Python to generate the note content.
4. TS persists the generated note through repository application services.

This keeps repository storage policy, path conventions, and access rules centralized.

## 7.4 Knowledge Ingestion and Knowledge Expansion

### Product Goal

The user should be able to:

- paste knowledge
- upload files or create notes
- have the system expand knowledge based on existing notes and preferred patterns
- ask questions against accumulated knowledge

### Source of Truth Rule

Repository resources remain the source of truth for note content.

Do not create a second full-content knowledge store as the primary source. Create an indexing layer that references repository resources.

### Recommended Indexing Model

Each indexed chunk should reference:

- `identityId`
- `repositoryId`
- `resourceId`
- `resourcePath`
- `chunkIndex`
- `contentHash`
- `embedding`
- `metadata`

### Trigger Model

Recommended ingestion triggers:

- resource create
- resource update
- batch upload
- explicit reindex
- optional scheduled backfill

### Expansion Model

Python can:

- summarize notes
- extract structured facts
- generate follow-up note drafts
- apply user-chosen templates or writing patterns
- refine an in-progress draft against cited repository excerpts

The final write-back should still go through the repository module boundary.

## 7.5 Database Knowledge Q&A

### Recommendation

Do not begin with unrestricted Text-to-SQL over the full application schema.

The schema is broad and domain-rich. A generic SQL agent introduced too early will be brittle, hard to secure, and difficult to explain.

### Recommended Order

Phase 1:

- controlled read-only domain tools
- prebuilt analytics queries
- dashboard-style aggregation endpoints

Phase 2:

- limited SQL generation for a small read-only schema subset
- strict allowlist of tables and columns
- query timeout, row limit, and audit logging

### Tool-First Examples

- task completion summary
- high-priority task count
- goal progress overview
- note/resource counts
- reminder completion behavior

This will deliver useful answers before full SQL agent complexity arrives.

## 8. Data Model Strategy

### 8.1 Existing Tables to Reuse

The following existing tables should remain relevant:

- `AiConversation`
- `AiMessage`
- `AiProviderConfig`
- `AiGenerationTask`
- `KnowledgeGenerationTask`

### 8.2 Task Tracking Recommendation

Prefer reusing and extending existing AI task tables before introducing a second parallel job system.

Suggested use:

- `AiGenerationTask` for chat-adjacent or goal/task planning jobs
- `KnowledgeGenerationTask` for knowledge generation and indexing workflows

### 8.3 New Storage Likely Needed

The RAG capability will likely require new tables for:

- knowledge chunk metadata
- vector embeddings
- indexing run status
- retrieval citations
- optional eval case results

### 8.4 Vector Storage

The development and production databases should support vector indexing.

The current local Docker compose uses plain PostgreSQL. The plan should include a migration path to a PostgreSQL setup with vector support in development and production.

## 9. Desktop Strategy

Desktop is the main reason this plan should be phased.

### 9.1 Recommended Phase Strategy

Recommended first:

- add Python for server/API-backed AI paths
- keep existing desktop TypeScript AI path for compatibility
- optionally let desktop call the remote API for advanced AI capabilities

Not recommended for phase 1:

- bundling a local Python runtime into the desktop app
- forcing all desktop AI flows through a new local Python process

### 9.2 Why Local Python in Desktop Should Come Later

Bundling Python inside Electron adds complexity in:

- packaging
- updates
- startup lifecycle
- process supervision
- Windows distribution
- macOS code signing
- debugging local environment issues

Local desktop Python can be revisited after the web/API-backed Python architecture is proven.

## 10. Monorepo Layout Recommendation

Recommended new project:

```text
apps/
  ai-service/
    pyproject.toml
    README.md
    src/
      app/
        main.py
        api/
        services/
        workers/
        schemas/
        clients/
        repositories/
        observability/
        config/
    tests/
```

Recommended ownership:

- `apps/ai-service`: Python runtime and AI execution
- `packages/ai`: shared TS AI boundary and adapters
- `apps/api`: public HTTP gateway to AI
- `apps/desktop`: desktop routing and optional remote/local strategy

## 11. Tooling and Operations

### 11.1 Python Stack

Recommended baseline:

- FastAPI
- Pydantic
- httpx
- pytest
- ruff
- pyright or mypy

Optional later:

- LangGraph or similar orchestration layer
- SQLAlchemy or asyncpg
- pgvector client support

### 11.2 Nx Integration

Add Nx targets for the Python app:

- `serve`
- `test`
- `lint`
- `typecheck`
- `build` if packaging is needed

The current repo already uses `nx:run-commands` heavily. The Python app can follow the same pattern.

### 11.3 Docker and Dev Workflow

The local development environment should eventually support:

- postgres with vector support
- redis if task queueing evolves in that direction
- powersync
- ai-python

The phase 1 workflow should aim for:

```text
pnpm nx run-many -t serve --projects=api,web,ai-service
```

Desktop can remain optional in day-to-day AI backend development.

## 12. Observability and Evaluation

AI work without evaluation becomes demo-driven and fragile.

Minimum observability goals:

- request ID propagation
- latency tracking
- token/cost tracking
- provider/model tracking
- error classification
- user-visible failure context

Minimum evaluation goals:

- chat response sanity cases
- goal decomposition correctness checks
- knowledge retrieval citation checks
- false-positive and hallucination tracking

## 13. Implementation Phases

## Phase 0: Architecture Alignment and Contract Freeze

Status: Done

### Goals

- confirm architectural boundaries
- freeze the public TS-facing AI contracts for the first rollout
- define the internal Node-to-Python contract

### Work

1. Document the Node-to-Python internal endpoints and payloads.
2. Decide which existing public endpoints remain unchanged in phase 1.
3. Define how provider runtime config is passed to Python.
4. Define request tracing and service authentication format.

### Deliverables

- internal API contract draft
- service auth format
- rollout constraints list

### Exit Criteria

- there is no ambiguity about what stays in TS and what moves to Python first

## Phase 1: Python Service Skeleton

Status: Done

### Goals

- create `apps/ai-python`
- make it runnable in the monorepo
- wire basic health and service authentication

### Work

1. Create the Python app structure.
2. Add local dependency management.
3. Add a health endpoint.
4. Add service auth middleware.
5. Add Nx targets.
6. Add local dev startup instructions.

### Deliverables

- working FastAPI service
- Nx integration
- local documentation

### Exit Criteria

- the Python service starts reliably from the monorepo
- Node can call the health endpoint

## Phase 2: Chat Execution Migration

Status: Done

### Goals

- move chat inference from direct TS provider calls into Python
- preserve current conversation persistence and API shape
- introduce streaming support

### Work

1. Add a TS execution adapter that calls Python.
2. Add Python chat complete and chat stream endpoints.
3. Update the TS chat service to use the adapter.
4. Add SSE path from API to UI.
5. Persist final assistant output from TS after stream completion.

### Deliverables

- Node-to-Python chat flow
- streaming chat path
- unchanged or minimally changed UI contract

### Exit Criteria

- existing chat UI still works
- assistant output comes from Python
- conversation data still lands in existing AI tables

## Phase 3: Goal Planning Migration

Status: Done

### Goals

- replace placeholder goal generation with real structured planning
- keep creation of business entities on the TS side

### Work

1. Add Python goal planning endpoint.
2. Return structured outputs for:
   - goal
   - key results
   - optional task templates
3. Update TS goal generation flow to use Python.
4. Keep user confirmation in the UI.

### Deliverables

- structured goal plan generation
- typed goal draft payloads

### Exit Criteria

- goal drafts are materially better than the current placeholder implementation
- no direct Python writes into goal/task business tables are required

## Phase 4: Knowledge Generation and Write-Back

Status: Done

### Goals

- move note content generation into Python
- keep repository persistence in TS

### Work

1. Add Python note generation endpoint.
2. Keep target subpath resolution on the TS side.
3. Persist generated notes via repository module application services.
4. Preserve current UX where generated notes appear in repository.

### Deliverables

- generated note content from Python
- repository-backed persistence retained

### Exit Criteria

- generated notes are still visible as normal repository resources
- no direct Python repository writes are needed

## Phase 5: Knowledge Ingestion and RAG

Status: Partial

### Goals

- index repository resources
- support retrieval with citations
- support knowledge expansion workflows

### Work

1. Add indexing tables and migration strategy.
2. Add Python ingestion worker or job processor.
3. Trigger indexing when repository resources change.
4. Add retrieval endpoint with citations.
5. Add optional note expansion endpoint.

### Deliverables

- chunking pipeline
- embedding storage
- retrieval with source attribution

### Exit Criteria

- knowledge queries can cite real repository sources
- reindexing is repeatable and auditable

Current implementation note:

1. Retrieval with citations exists.
2. Reindexing is auditable and repository resource mutations now auto-trigger incremental reindexing.
3. Knowledge expansion now has an internal endpoint for grounded note refinement.
4. Provider-backed embeddings now cover query-triggered sync, draft expansion, manual reindex, repository-mutation auto reindex, and query-side citation ranking, with deterministic local fallback when embeddings are unavailable.
5. Server-side Prisma persistence now uses a dedicated `AiKnowledgeIndexEntry` table, while desktop and PowerSync still retain metadata-backed persistence and fallback behavior.
6. TS knowledge sync now uses the knowledge index repository as its first retrieval layer and falls back to raw repository resources only when indexed recall is insufficient.
7. Server-side Prisma retrieval now has an optional `pgvector` candidate-recall path backed by a `retrieval_vector` column and IVFFlat index, with automatic fallback when the extension or migration is unavailable.
8. AI capabilities now expose knowledge-index diagnostics so the runtime can report whether it is using the Prisma table, legacy metadata fallback, `pgvector` recall, or lexical-hybrid fallback.
9. Local Docker development now uses `pgvector`-capable Postgres images so the optional ANN path can be exercised in dev once the database container is recreated.
10. Desktop-side ANN retrieval and a fully separate vector database are still pending.

## Phase 6: Controlled Analytics and Database Q&A

Status: Done

### Goals

- answer business questions safely
- avoid unsafe full-schema SQL generation at first

### Work

1. Expose curated analytics tools from TS.
2. Let Python select and combine those tools.
3. Add read-only query planning for a narrow schema subset if needed.
4. Add audit logs for generated analytical queries.

### Deliverables

- controlled domain Q&A
- safe analytics query pathway

### Exit Criteria

- useful business questions are answerable without exposing unrestricted SQL access

## Phase 7: Agent Tooling for Goal and Task Automation

Status: Done

### Goals

- allow Python to request tool execution for real business actions
- keep all side effects within TS module boundaries

### Work

1. Define explicit tools for:
   - create goal
   - create key result
   - create task template
   - search notes
   - fetch stats
2. Add human confirmation steps where side effects are meaningful.
3. Log tool calls and execution results.

### Deliverables

- tool-calling agent flows
- side-effect-safe execution model

### Exit Criteria

- AI can automate workflows without bypassing domain boundaries

## Phase 8: Desktop Advanced Strategy Decision

Status: Partial

### Goals

- decide whether desktop advanced AI should stay remote-backed or gain local Python support

### Work

Option A:

- desktop calls remote API for advanced AI capabilities

Option B:

- desktop spawns local Python on loopback
- Electron remains the gateway and tool executor

### Recommended Decision Order

Do not choose Option B until phases 1 through 7 are stable.

### Exit Criteria

- the team can justify the operational cost of local desktop Python

Current implementation note:

1. The strategy decision is currently Option A.
2. Desktop advanced AI capabilities are remote-backed.
3. Local desktop Python runtime has not been implemented yet.

## 14. Acceptance Criteria for the Overall Program

The integration should be considered successful when:

1. The UI continues to use stable TS-facing AI contracts.
2. Python becomes the execution engine for chat, goal planning, and knowledge retrieval.
3. Repository stays the source of truth for note files.
4. AI business side effects still go through TS domain modules.
5. Desktop remains supported through an explicit strategy rather than accidental breakage.
6. AI outputs are observable, auditable, and testable.

## 15. Recommended Immediate Next Step

The recommended next implementation step is:

1. Deploy the new knowledge-index migrations to the real database and run `pnpm nx run database:ai-knowledge-smoke` so the optional `pgvector` path can be validated outside unit tests.
2. Expand the current evaluation report surfacing into richer quality monitoring, including trend views, stronger failure drill-down, and cost visibility.
3. Revisit local desktop Python only after the remote-backed quality loop is mature.

This gives the highest next signal with lower risk than shipping local Python packaging too early.
