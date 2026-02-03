---

description: "Task list for contracts baseline across modules"
---

# Tasks: Define base contracts for RPC/events across all modules

**Input**: Design documents from /specs/main/
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not requested for this feature.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: [ID] [P?] [Story] Description

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 [US1] Inventory modules and confirm protocol/api/dtos folders exist under packages/contracts/src/modules/*
- [ ] T002 [US1] Document contract layering rules (protocol → api → dtos) in packages/contracts/README.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 [US1] Define module event key naming convention in packages/contracts/README.md
- [ ] T004 [US1] Create/update module index re-exports for protocol/api/dtos in packages/contracts/src/modules/*/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Standardize base contracts for all modules (Priority: P1) 🎯 MVP

**Goal**: Every module has base RPC/event maps that reference API schema types, with composed DTOs in dtos when needed.

**Independent Test**: Typecheck or build contracts package successfully and confirm all RPC maps reference API types (no inline request/response shapes).

### Implementation for User Story 1

**Account module**
- [ ] T005 [P] [US1] Define/align API schemas and req/res types in packages/contracts/src/modules/account/api/*.ts
- [ ] T006 [P] [US1] Define composed DTOs (if needed) in packages/contracts/src/modules/account/dtos/*.ts
- [ ] T007 [US1] Update RPC map to use API types in packages/contracts/src/modules/account/protocol/account-rpc-map.ts
- [ ] T008 [US1] Update event map to use API/DTO types in packages/contracts/src/modules/account/protocol/account-event-map.ts

**AI module**
- [ ] T009 [P] [US1] Define/align API schemas and req/res types in packages/contracts/src/modules/ai/api/*.ts
- [ ] T010 [P] [US1] Define composed DTOs (if needed) in packages/contracts/src/modules/ai/dtos/*.ts
- [ ] T011 [US1] Update RPC map to use API types in packages/contracts/src/modules/ai/protocol/ai-rpc-map.ts
- [ ] T012 [US1] Update event map to use API/DTO types in packages/contracts/src/modules/ai/protocol/ai-event-map.ts

**Authentication module**
- [ ] T013 [P] [US1] Align login request union and API schemas in packages/contracts/src/modules/authentication/api/login.ts
- [ ] T014 [P] [US1] Ensure composed response types in packages/contracts/src/modules/authentication/dtos/*.ts
- [ ] T015 [US1] Update RPC map to use API types in packages/contracts/src/modules/authentication/protocol/auth-rpc-map.ts
- [ ] T016 [US1] Update event map to use API/DTO types in packages/contracts/src/modules/authentication/protocol/auth-event-map.ts

**Editor module**
- [ ] T017 [P] [US1] Define/align API schemas and req/res types in packages/contracts/src/modules/editor/api/*.ts
- [ ] T018 [P] [US1] Define composed DTOs (if needed) in packages/contracts/src/modules/editor/dtos/*.ts
- [ ] T019 [US1] Update RPC map to use API types in packages/contracts/src/modules/editor/protocol/editor-rpc-map.ts
- [ ] T020 [US1] Update event map to use API/DTO types in packages/contracts/src/modules/editor/protocol/editor-event-map.ts

**Example module**
- [ ] T021 [P] [US1] Define/align API schemas and req/res types in packages/contracts/src/modules/example/api/*.ts
- [ ] T022 [P] [US1] Define composed DTOs (if needed) in packages/contracts/src/modules/example/dtos/*.ts
- [ ] T023 [US1] Update RPC map to use API types in packages/contracts/src/modules/example/protocol/example-rpc-map.ts
- [ ] T024 [US1] Update event map to use API/DTO types in packages/contracts/src/modules/example/protocol/example-event-map.ts

**Goal module**
- [ ] T025 [P] [US1] Define/align API schemas and req/res types in packages/contracts/src/modules/goal/api/*.ts
- [ ] T026 [P] [US1] Define composed DTOs (if needed) in packages/contracts/src/modules/goal/dtos/*.ts
- [ ] T027 [US1] Update RPC map to use API types in packages/contracts/src/modules/goal/protocol/goal-rpc-map.ts
- [ ] T028 [US1] Update event map to use API/DTO types in packages/contracts/src/modules/goal/protocol/goal-event-map.ts

**Notification module**
- [ ] T029 [P] [US1] Define/align API schemas and req/res types in packages/contracts/src/modules/notification/api/*.ts
- [ ] T030 [P] [US1] Define composed DTOs (if needed) in packages/contracts/src/modules/notification/dtos/*.ts
- [ ] T031 [US1] Update RPC map to use API types in packages/contracts/src/modules/notification/protocol/notification-rpc-map.ts
- [ ] T032 [US1] Update event map to use API/DTO types in packages/contracts/src/modules/notification/protocol/notification-event-map.ts

**Reminder module**
- [ ] T033 [P] [US1] Define/align API schemas and req/res types in packages/contracts/src/modules/reminder/api/*.ts
- [ ] T034 [P] [US1] Define composed DTOs (if needed) in packages/contracts/src/modules/reminder/dtos/*.ts
- [ ] T035 [US1] Update RPC map to use API types in packages/contracts/src/modules/reminder/protocol/reminder-rpc-map.ts
- [ ] T036 [US1] Update event map to use API/DTO types in packages/contracts/src/modules/reminder/protocol/reminder-event-map.ts

**Repository module**
- [ ] T037 [P] [US1] Define/align API schemas and req/res types in packages/contracts/src/modules/repository/api/*.ts
- [ ] T038 [P] [US1] Define composed DTOs (if needed) in packages/contracts/src/modules/repository/dtos/*.ts
- [ ] T039 [US1] Update RPC map to use API types in packages/contracts/src/modules/repository/protocol/repository-rpc-map.ts
- [ ] T040 [US1] Update event map to use API/DTO types in packages/contracts/src/modules/repository/protocol/repository-event-map.ts

**Schedule module**
- [ ] T041 [P] [US1] Define/align API schemas and req/res types in packages/contracts/src/modules/schedule/api/*.ts
- [ ] T042 [P] [US1] Define composed DTOs (if needed) in packages/contracts/src/modules/schedule/dtos/*.ts
- [ ] T043 [US1] Update RPC map to use API types in packages/contracts/src/modules/schedule/protocol/schedule-rpc-map.ts
- [ ] T044 [US1] Update event map to use API/DTO types in packages/contracts/src/modules/schedule/protocol/schedule-event-map.ts

**Setting module**
- [ ] T045 [P] [US1] Define/align API schemas and req/res types in packages/contracts/src/modules/setting/api/*.ts
- [ ] T046 [P] [US1] Define composed DTOs (if needed) in packages/contracts/src/modules/setting/dtos/*.ts
- [ ] T047 [US1] Update RPC map to use API types in packages/contracts/src/modules/setting/protocol/setting-rpc-map.ts
- [ ] T048 [US1] Update event map to use API/DTO types in packages/contracts/src/modules/setting/protocol/setting-event-map.ts

**Sync module**
- [ ] T049 [P] [US1] Define/align API schemas and req/res types in packages/contracts/src/modules/sync/api/*.ts
- [ ] T050 [P] [US1] Define composed DTOs (if needed) in packages/contracts/src/modules/sync/dtos/*.ts
- [ ] T051 [US1] Update RPC map to use API types in packages/contracts/src/modules/sync/protocol/sync-rpc-map.ts
- [ ] T052 [US1] Update event map to use API/DTO types in packages/contracts/src/modules/sync/protocol/sync-event-map.ts

**Task module**
- [ ] T053 [P] [US1] Define/align API schemas and req/res types in packages/contracts/src/modules/task/api/*.ts
- [ ] T054 [P] [US1] Define composed DTOs (if needed) in packages/contracts/src/modules/task/dtos/*.ts
- [ ] T055 [US1] Update RPC map to use API types in packages/contracts/src/modules/task/protocol/task-rpc-map.ts
- [ ] T056 [US1] Update event map to use API/DTO types in packages/contracts/src/modules/task/protocol/task-event-map.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T057 [P] Update contracts registry in specs/main/contracts/rpc-events.openapi.yaml
- [ ] T058 Run quickstart validation checklist in specs/main/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on User Story 1 completion

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories

### Within User Story 1

- API schemas before RPC maps
- DTOs before RPC maps when used in responses
- Event maps updated after API/DTO types are finalized

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All module tasks marked [P] can run in parallel across modules
- Polish tasks marked [P] can run in parallel after US1

---

## Parallel Example: User Story 1

Parallel module work examples:
- Task: "Define/align API schemas and req/res types in packages/contracts/src/modules/account/api/*.ts"
- Task: "Define/align API schemas and req/res types in packages/contracts/src/modules/goal/api/*.ts"
- Task: "Define/align API schemas and req/res types in packages/contracts/src/modules/task/api/*.ts"

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Typecheck/build contracts to confirm RPC maps reference API schemas

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Complete User Story 1 → Validate contracts build/typecheck
3. Apply Polish tasks

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done, split modules across developers to update API schemas, DTOs, and protocol maps in parallel
3. Consolidate and validate build/typecheck
