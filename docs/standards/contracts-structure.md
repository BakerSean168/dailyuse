# Contracts Package Structure

## 1. Goal & Philosophy
The `packages/contracts` library is the **Type Registry** for the entire system.
To keep it maintainable, we enforce a strict directory structure that separates **Domain Identity** (Entities) from **Data Transfer** (API).

## 2. Directory Structure Rule
Every module in `contracts/src/modules/*` MUST follow this structure:

```plaintext
modules/task/
├── index.ts                  # Main Entry Point
├── aggregates/               # Domain Aggregates (Root Entities)
│   ├── index.ts
│   ├── TaskServer.ts         # Server-side Representation (includes sensitive data)
│   └── TaskClient.ts         # Client-side Representation (sanitized)
├── entities/                 # Sub-Entities
│   └── TaskHistory.ts
├── value-objects/            # Value Objects (Immutable, Logicless)
│   └── TaskConfig.ts
├── api/                      # Data Transfer Objects (DTOs)
│   ├── index.ts
│   ├── requests/             # Input Types (Requests, Commands, Payloads)
│   │   └── CreateTaskRequest.ts
│   └── responses/            # Output Types (Responses, Views)
│       └── TaskListView.ts
└── ui/                       # Frontend-specific Types
    ├── index.ts
    └── TaskCardProps.ts      # Shared Component Props
```

## 3. Naming & Content Rules

### No "Generic" Entities
- ❌ **Anti-Pattern**: Defining a generic `interface Task { ... }`.
- ✅ **Rule**: Explicitly define `TaskServer` and `TaskClient`.
    - **Why?**: Avoids accidental leakage of backend fields (like `deletedAt`, `internalFlags`) to the frontend.

### Semantic API Naming
Do not forcefully append `DTO`. Use semantic suffixes:
- **Inputs**: `*Request` (HTTP Body), `*Query` (GET Params), `*Payload` (Event Data).
- **Outputs**: `*Response` (Wrapper), `*View` (UI Model), `*Result` (Operation Outcome).

### Folder Organization
- **Domain Types** (`aggregates`, `entities`, `value-objects`) should be kept separate from **API Types** (`api`).
- **Mixed Files**: Do NOT mix Entity definitions and API DTOs in the same file (e.g., `api-requests.ts` containing everything is forbidden).

## 4. Export Rules
- All folders must have an `index.ts`.
- The module root `index.ts` must re-export everything.
