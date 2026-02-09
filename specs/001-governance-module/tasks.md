# Tasks: Governance Module

**Input**: Design documents from `/specs/001-governance-module/`
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: Tests are included as OPTIONAL tasks. Only implement if explicitly requested or following TDD approach.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

All paths relative to repository root: `d:\home\projects\dailyuse`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Basic project structure and tooling configuration

- [x] T001 Verify Nx workspace configuration recognizes governance package in nx.json
- [x] T002 [P] Configure TypeScript strict mode in packages/governance/tsconfig.json
- [x] T003 [P] Setup Vitest configuration in packages/governance/vitest.config.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Setup Prisma client generation script in packages/governance/package.json
- [x] T005 Create base Result<T> type (if not exists) in packages/utils/src/result.ts
- [x] T006 [P] Create base ValueObject<T> class in packages/utils/src/value-object.ts
- [x] T007 [P] Create base Entity<T> class in packages/utils/src/entity.ts
- [x] T008 [P] Create createIdType utility in packages/utils/src/id-type.ts
- [x] T009 Setup EventBus interface in packages/infrastructure-server/src/event-bus.interface.ts
- [x] T010 Configure authentication middleware in apps/api/src/middleware/auth.ts
- [x] T011 Configure RBAC middleware in apps/api/src/middleware/rbac.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 5 - Package Restructuring (Priority: P0) 🎯 MVP PREREQUISITE

**Goal**: Rename `example-sample` to `governance` to establish foundation package

**Independent Test**: Package builds successfully, Nx graph recognizes `governance`, all imports resolve

### Implementation for User Story 5

- [x] T012 [US5] Delete old standalone governance package (if exists) in packages/governance/
- [x] T013 [US5] Rename packages/example-sample directory to packages/governance using git mv
- [x] T014 [US5] Update package name in packages/governance/package.json from @dailyuse/example-sample to @dailyuse/governance
- [x] T015 [US5] Update Nx project name in packages/governance/project.json
- [x] T016 [US5] Update path mappings in tsconfig.base.json from @dailyuse/example-sample to @dailyuse/governance
- [x] T017 [US5] Update barrel export namespace in packages/governance/src/index.ts from ExampleSample to Governance
- [x] T018 [US5] Find and replace all import statements referencing example-sample in apps/api/src/
- [x] T019 [US5] Find and replace all import statements referencing example-sample in apps/web/src/
- [x] T020 [US5] Find and replace all import statements referencing example-sample in apps/desktop/src/
- [x] T021 [US5] Build governance package to verify no errors: `pnpm nx build governance`
- [x] T022 [US5] Run Nx graph visualization to verify governance node appears: `pnpm nx graph`
- [x] T023 [US5] Commit package restructuring with message "refactor: rename example-sample to governance package"

**Checkpoint**: Package renamed, all references updated, build passes. Ready for domain implementation.

---

## Phase 4: User Story 2 Foundation - Domain Layer (Priority: P2)

**Goal**: Implement core domain model (Rule aggregate, RuleRevision entity, value objects) as foundation for all features

**Independent Test**: Domain objects pass unit tests, business rules enforced, state machine validated

### Tests for User Story 2 Domain (OPTIONAL) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T024 [P] [US2] Unit test for RuleId branded type in packages/governance/src/domain-shared/value-objects/__tests__/rule-id.spec.ts
- [ ] T025 [P] [US2] Unit test for RuleTag normalization in packages/governance/src/domain-shared/value-objects/__tests__/rule-tag.spec.ts
- [ ] T026 [P] [US2] Unit test for RuleStatus state machine in packages/governance/src/domain-shared/value-objects/__tests__/rule-status.spec.ts
- [ ] T027 [P] [US2] Unit test for CodeSnippet validation in packages/governance/src/domain-shared/value-objects/__tests__/code-snippet.spec.ts
- [ ] T028 [P] [US2] Unit test for Rule aggregate lifecycle in packages/governance/src/domain-server/aggregates/__tests__/rule.spec.ts
- [ ] T029 [P] [US2] Unit test for RuleRevision immutability in packages/governance/src/domain-server/entities/__tests__/rule-revision.spec.ts

### Implementation for User Story 2 Domain

**Contracts Layer** (packages/governance/src/contracts/)

- [x] T030 [P] [US2] Create RuleStatus const object enum in packages/governance/src/contracts/value-objects/rule-status.ts
- [x] T031 [P] [US2] Create RuleSeverity const object enum in packages/governance/src/contracts/value-objects/rule-severity.ts
- [x] T032 [P] [US2] Create Language enum in packages/governance/src/contracts/value-objects/language.ts
- [x] T033 [P] [US2] Create SnippetType enum in packages/governance/src/contracts/value-objects/snippet-type.ts
- [x] T034 [P] [US2] Create RuleClientDTO interface in packages/governance/src/contracts/aggregates/rule-client.ts
- [x] T035 [P] [US2] Create RuleServerDTO interface in packages/governance/src/contracts/aggregates/rule-server.ts
- [x] T036 [P] [US2] Create RuleRevisionDTO interface in packages/governance/src/contracts/entities/rule-revision.ts

**Domain-Shared (Value Objects)** (packages/governance/src/domain-shared/value-objects/)

- [x] T037 [P] [US2] Implement RuleId branded type using createIdType in packages/governance/src/domain-shared/value-objects/rule-id.ts
- [x] T038 [P] [US2] Implement RuleTag with normalization (lowercase-kebab-case) in packages/governance/src/domain-shared/value-objects/rule-tag.ts
- [x] T039 [P] [US2] Implement RuleStatus companion with canTransitionTo() method in packages/governance/src/domain-shared/value-objects/rule-status-companion.ts
- [x] T040 [P] [US2] Implement RuleSeverity companion with factory methods in packages/governance/src/domain-shared/value-objects/rule-severity-companion.ts
- [x] T041 [P] [US2] Implement CodeSnippet value object with validation (max 10KB) in packages/governance/src/domain-shared/value-objects/code-snippet.ts

**Domain-Server (Aggregates & Entities)** (packages/governance/src/domain-server/)

- [x] T042 [US2] Implement Rule aggregate with private constructor and Props Object pattern in packages/governance/src/domain-server/aggregates/rule.ts
- [x] T043 [US2] Add Rule.create() factory method with validation in packages/governance/src/domain-server/aggregates/rule.ts
- [x] T044 [US2] Add Rule.activate() method for Draft→Active transition in packages/governance/src/domain-server/aggregates/rule.ts
- [x] T045 [US2] Add Rule.deprecate() method with severity validation in packages/governance/src/domain-server/aggregates/rule.ts
- [x] T046 [US2] Add Rule.reactivate() method for Deprecated→Active transition in packages/governance/src/domain-server/aggregates/rule.ts
- [x] T047 [US2] Add Rule.update() method with domain event emission in packages/governance/src/domain-server/aggregates/rule.ts
- [x] T048 [US2] Add Rule.changeSeverity() method with lifecycle validation in packages/governance/src/domain-server/aggregates/rule.ts
- [x] T049 [US2] Add Rule.addTag() and Rule.removeTag() methods in packages/governance/src/domain-server/aggregates/rule.ts
- [x] T050 [US2] Add Rule.addCodeSnippet() and Rule.removeCodeSnippet() methods in packages/governance/src/domain-server/aggregates/rule.ts
- [x] T051 [US2] Implement RuleRevision entity as immutable (no update/delete methods) in packages/governance/src/domain-server/entities/rule-revision.ts
- [x] T052 [US2] Add RuleRevision.create() factory with sequential revision numbering in packages/governance/src/domain-server/entities/rule-revision.ts

**Domain-Server (Repository Interface)**

- [x] T053 [US2] Create IRuleRepository interface with CRUD methods in packages/governance/src/domain-server/repositories/i-rule-repository.ts
- [x] T054 [US2] Define RULE_REPOSITORY_TOKEN DI symbol in packages/governance/src/domain-server/repositories/i-rule-repository.ts

**Checkpoint**: ✅ Domain layer complete with all business rules enforced. Ready for application services.

---

## Phase 5: User Story 2 - Application & Infrastructure (Priority: P2)

**Goal**: Implement use cases and persistence layer for Rule CRUD operations

**Independent Test**: Application services execute successfully, repository persists and retrieves data correctly

### Tests for User Story 2 Application (OPTIONAL) ⚠️

- [ ] T055 [P] [US2] Integration test for RuleApplicationService.createRule in packages/governance/src/application/__tests__/rule-application-service.spec.ts
- [ ] T056 [P] [US2] Integration test for RuleApplicationService.updateRule in packages/governance/src/application/__tests__/rule-application-service.spec.ts
- [ ] T057 [P] [US2] Integration test for PrismaRuleRepository with in-memory SQLite in packages/governance/src/infrastructure/__tests__/prisma-rule-repository.spec.ts

### Implementation for User Story 2 Application

**Application Layer** (packages/governance/src/application/)

- [x] T058 [P] [US2] Create CreateRuleReq and CreateRuleRes types in packages/governance/src/application/dtos/create-rule.dto.ts
- [x] T059 [P] [US2] Create UpdateRuleReq and UpdateRuleRes types in packages/governance/src/application/dtos/update-rule.dto.ts
- [x] T060 [P] [US2] Create GetRuleReq and GetRuleRes types in packages/governance/src/application/dtos/get-rule.dto.ts
- [x] T061 [P] [US2] Create DeleteRuleReq and DeleteRuleRes types in packages/governance/src/application/dtos/delete-rule.dto.ts
- [x] T062 [P] [US2] Create ListRulesReq and ListRulesRes types in packages/governance/src/application/dtos/list-rules.dto.ts
- [x] T063 [US2] Implement RuleApplicationService with createRule use case in packages/governance/src/application/services/rule-application-service.ts
- [x] T064 [US2] Add RuleApplicationService.updateRule use case in packages/governance/src/application/services/rule-application-service.ts
- [x] T065 [US2] Add RuleApplicationService.deleteRule use case (soft delete logic) in packages/governance/src/application/services/rule-application-service.ts
- [x] T066 [US2] Add RuleApplicationService.getRule use case in packages/governance/src/application/services/rule-application-service.ts
- [x] T067 [US2] Add RuleApplicationService.listRules use case with filters in packages/governance/src/application/services/rule-application-service.ts
- [x] T068 [P] [US2] Implement RuleRevisionApplicationService.getRevisions in packages/governance/src/application/services/rule-revision-application-service.ts
- [x] T069 [P] [US2] Create RuleMapper for domain ↔ DTO conversion in packages/governance/src/application/mappers/rule-mapper.ts

### Implementation for User Story 2 Infrastructure

**Infrastructure Layer** (packages/governance/src/infrastructure/)

- [x] T070 [US2] Create Prisma schema for Rule model in packages/governance/src/infrastructure/prisma/schema.prisma
- [x] T071 [US2] Add RuleRevision model to Prisma schema with unique constraint on [ruleId, revisionNumber] in packages/governance/src/infrastructure/prisma/schema.prisma
- [x] T072 [US2] Generate Prisma client: `pnpm nx run governance:prisma-generate`
- [x] T073 [US2] Create migration for rules table: `pnpm nx run governance:prisma-migrate`
- [x] T074 [US2] Implement PrismaRuleRepository.save() method in packages/governance/src/infrastructure/repositories/prisma-rule-repository.ts
- [x] T075 [US2] Implement PrismaRuleRepository.findById() method in packages/governance/src/infrastructure/repositories/prisma-rule-repository.ts
- [x] T076 [US2] Implement PrismaRuleRepository.findByCode() method in packages/governance/src/infrastructure/repositories/prisma-rule-repository.ts
- [x] T077 [US2] Implement PrismaRuleRepository.findAll() with filters in packages/governance/src/infrastructure/repositories/prisma-rule-repository.ts
- [x] T078 [US2] Implement PrismaRuleRepository.delete() method in packages/governance/src/infrastructure/repositories/prisma-rule-repository.ts
- [x] T079 [US2] Implement PrismaRuleRepository.exists() method in packages/governance/src/infrastructure/repositories/prisma-rule-repository.ts
- [x] T080 [P] [US2] Create RulePersistenceMapper for Prisma ↔ domain conversion in packages/governance/src/infrastructure/mappers/rule-persistence-mapper.ts

**Checkpoint**: Application services and repository complete. Ready for API layer.

---

## Phase 6: User Story 2 - API & Editor UI (Priority: P2)

**Goal**: Expose Rule CRUD via API endpoints and implement Rule editor UI for Tech Leads/Architects

**Independent Test**: API endpoints return correct responses with RBAC enforcement; editor UI can create/edit rules

### Tests for User Story 2 API (OPTIONAL) ⚠️

- [x] T081 [P] [US2] Contract test for POST /api/rules endpoint in apps/api/src/modules/governance/__tests__/governance-crud.routes.spec.ts
- [x] T082 [P] [US2] Contract test for PUT /api/rules/:id endpoint in apps/api/src/modules/governance/__tests__/governance-crud.routes.spec.ts
- [x] T083 [P] [US2] Contract test for DELETE /api/rules/:id endpoint in apps/api/src/modules/governance/__tests__/governance-crud.routes.spec.ts

### Implementation for User Story 2 API

**API Layer** (apps/api/src/modules/governance/)

- [x] T084 [P] [US2] Create Zod CreateRuleSchema in apps/api/src/modules/governance/schemas/create-rule.schema.ts
- [x] T085 [P] [US2] Create Zod UpdateRuleSchema in apps/api/src/modules/governance/schemas/update-rule.schema.ts
- [x] T086 [US2] Implement POST /api/rules route with requireRole(['TechLead', 'Architect']) in apps/api/src/modules/governance/routes/governance-crud.routes.ts
- [x] T087 [US2] Implement PUT /api/rules/:id route with RBAC middleware in apps/api/src/modules/governance/routes/governance-crud.routes.ts
- [x] T088 [US2] Implement DELETE /api/rules/:id route with soft delete logic in apps/api/src/modules/governance/routes/governance-crud.routes.ts
- [x] T089 [US2] Implement GET /api/rules/:id route (all authenticated users) in apps/api/src/modules/governance/routes/governance-crud.routes.ts
- [x] T090 [US2] Implement GET /api/rules route with query filters in apps/api/src/modules/governance/routes/governance-crud.routes.ts
- [x] T091 [P] [US2] Implement GET /api/rules/:id/revisions route in apps/api/src/modules/governance/routes/governance-crud.routes.ts
- [x] T092 [US2] Register governance routes in apps/api/src/app.ts

### Implementation for User Story 2 Web UI Editor

**Web UI - Editor** (apps/web/src/modules/governance/)

- [x] T093 [P] [US2] Create Pinia governanceStore with rules state in apps/web/src/modules/governance/stores/governance-store.ts
- [x] T094 [P] [US2] Add governanceStore.createRule action in apps/web/src/modules/governance/stores/governance-store.ts
- [x] T095 [P] [US2] Add governanceStore.updateRule action in apps/web/src/modules/governance/stores/governance-store.ts
- [x] T096 [P] [US2] Add governanceStore.deleteRule action in apps/web/src/modules/governance/stores/governance-store.ts
- [x] T097 [US2] Implement RuleEditorView component with form validation in apps/web/src/modules/governance/views/RuleEditorView.vue
- [x] T098 [US2] Add RuleForm component with title/description/severity fields in apps/web/src/modules/governance/components/RuleForm.vue
- [x] T099 [US2] Add CodeSnippetEditor component for Good/Bad examples in apps/web/src/modules/governance/components/CodeSnippetEditor.vue
- [x] T100 [US2] Add TagInput component with normalization preview in apps/web/src/modules/governance/components/TagInput.vue
- [x] T101 [US2] Add StatusBadge component for Draft/Active/Deprecated in apps/web/src/modules/governance/components/StatusBadge.vue
- [x] T102 [US2] Wire RuleEditorView to Vuetify router in apps/web/src/router/governance-routes.ts

**Checkpoint**: User Story 2 complete - Rule CRUD functional via API and UI editor

---

## Phase 7: User Story 1 - Pattern Discovery UI (Priority: P1)

**Goal**: Enable junior engineers to browse, filter, and view rules with code examples for self-service pattern discovery

**Independent Test**: Can browse rules by tag, view rule details with syntax-highlighted Good/Bad examples, navigate to live references

### Tests for User Story 1 (OPTIONAL) ⚠️

- [ ] T103 [P] [US1] Integration test for browsing rules by tag filter in apps/web/src/modules/governance/__tests__/governance-list-view.spec.ts
- [ ] T104 [P] [US1] Integration test for rule detail view rendering in apps/web/src/modules/governance/__tests__/governance-detail-view.spec.ts

### Implementation for User Story 1 Web UI

**Web UI - Discovery** (apps/web/src/modules/governance/)

- [x] T105 [P] [US1] Add governanceStore.fetchRules action in apps/web/src/modules/governance/stores/governance-store.ts
- [x] T106 [P] [US1] Add governanceStore.fetchRuleById action in apps/web/src/modules/governance/stores/governance-store.ts
- [x] T107 [P] [US1] Add governanceStore.filterByTag selector in apps/web/src/modules/governance/stores/governance-store.ts
- [x] T108 [P] [US1] Add governanceStore.filterByStatus selector in apps/web/src/modules/governance/stores/governance-store.ts
- [x] T109 [US1] Implement GovernanceListView component with tag filter chips in apps/web/src/modules/governance/views/GovernanceListView.vue
- [x] T110 [US1] Implement GovernanceDetailView component with Markdown rendering in apps/web/src/modules/governance/views/GovernanceDetailView.vue
- [x] T111 [US1] Add RuleCard component for list items in apps/web/src/modules/governance/components/RuleCard.vue
- [x] T112 [US1] Add CodeSnippetView component with Prism.js syntax highlighting in apps/web/src/modules/governance/components/CodeSnippetView.vue
- [x] T113 [US1] Add TagFilterChips component for tag selection in apps/web/src/modules/governance/components/TagFilterChips.vue
- [x] T114 [US1] Add LiveReferenceLink component for monorepo navigation in apps/web/src/modules/governance/components/LiveReferenceLink.vue
- [x] T115 [US1] Add DeprecationWarning component for deprecated rules in apps/web/src/modules/governance/components/DeprecationWarning.vue
- [x] T116 [US1] Wire GovernanceListView and GovernanceDetailView to router in apps/web/src/router/governance-routes.ts
- [x] T117 [US1] Install Prism.js for syntax highlighting: `pnpm add -F @dailyuse/web prismjs`

**Checkpoint**: User Story 1 complete - Pattern discovery functional with browsing, filtering, and detailed views

---

## Phase 8: User Story 3 - Keyword Search (Priority: P3)

**Goal**: Enable experienced developers to quickly find rules by keyword with relevance-scored results

**Independent Test**: Keyword search returns results ordered by relevance (title match > code > description > tags) with status weighting

### Tests for User Story 3 (OPTIONAL) ⚠️

- [ ] T118 [P] [US3] Unit test for relevance scoring algorithm in packages/governance/src/application/__tests__/rule-search-application-service.spec.ts
- [ ] T119 [P] [US3] Contract test for GET /api/rules/search endpoint in apps/api/src/modules/governance/__tests__/governance-search.routes.spec.ts

### Implementation for User Story 3 Application

**Application Layer - Search** (packages/governance/src/application/)

- [ ] T120 [P] [US3] Create SearchRulesReq and SearchRulesRes types in packages/governance/src/application/dtos/search-rules.dto.ts
- [ ] T121 [US3] Implement RuleSearchApplicationService with relevance scoring in packages/governance/src/application/services/rule-search-application-service.ts
- [ ] T122 [US3] Add relevance scoring logic (title exact > partial > code > description > tags) in packages/governance/src/application/services/rule-search-application-service.ts
- [ ] T123 [US3] Add status weighting (Active > Draft > Deprecated) to search results in packages/governance/src/application/services/rule-search-application-service.ts

### Implementation for User Story 3 Infrastructure

- [ ] T124 [US3] Add PrismaRuleRepository.search() method with keyword matching in packages/governance/src/infrastructure/repositories/prisma-rule-repository.ts

### Implementation for User Story 3 API

**API Layer - Search** (apps/api/src/modules/governance/)

- [ ] T125 [P] [US3] Create Zod SearchRulesQuerySchema in apps/api/src/modules/governance/schemas/search-rules.schema.ts
- [ ] T126 [US3] Implement GET /api/rules/search route in apps/api/src/modules/governance/routes/governance-search.routes.ts

### Implementation for User Story 3 Web UI

**Web UI - Search** (apps/web/src/modules/governance/)

- [x] T127 [P] [US3] Add governanceStore.searchRules action in apps/web/src/modules/governance/stores/governance-store.ts
- [x] T128 [US3] Add SearchBar component with debounce (300ms) in apps/web/src/modules/governance/components/SearchBar.vue
- [x] T129 [US3] Add SearchResultsList component with relevance indicators in apps/web/src/modules/governance/components/SearchResultsList.vue
- [x] T130 [US3] Wire SearchBar to GovernanceListView in apps/web/src/modules/governance/views/GovernanceListView.vue
- [x] T131 [US3] Add keyboard shortcut (/) for search focus in apps/web/src/modules/governance/views/GovernanceListView.vue

**Checkpoint**: User Story 3 complete - Keyword search functional with relevance scoring

---

## Phase 9: User Story 4 - RBAC & Audit (Priority: P4)

**Goal**: Enforce role-based access control and display immutable audit trails for governance

**Independent Test**: Engineers can read but not publish; Tech Leads can publish; revision history displays all changes

### Tests for User Story 4 (OPTIONAL) ⚠️

- [ ] T132 [P] [US4] Contract test for RBAC enforcement on POST /api/rules in apps/api/src/modules/governance/__tests__/rbac-enforcement.spec.ts
- [ ] T133 [P] [US4] Integration test for revision history retrieval in packages/governance/src/application/__tests__/rule-revision-application-service.spec.ts

### Implementation for User Story 4 RBAC

**API Layer - RBAC** (apps/api/src/middleware/)

- [ ] T134 [US4] Verify requireRole middleware enforces Tech Lead/Architect on create/update in apps/api/src/middleware/rbac.ts
- [ ] T135 [US4] Verify authenticateUser middleware allows all users on read endpoints in apps/api/src/middleware/auth.ts

### Implementation for User Story 4 Revision History

**Application Layer - Audit**

- [ ] T136 [US4] Verify RuleRevision records created on Rule.create() in packages/governance/src/domain-server/aggregates/rule.ts
- [ ] T137 [US4] Verify RuleRevision records created on Rule.update() in packages/governance/src/domain-server/aggregates/rule.ts
- [ ] T138 [US4] Add integration between Rule and RuleRevision in save flow in packages/governance/src/infrastructure/repositories/prisma-rule-repository.ts

### Implementation for User Story 4 Web UI

**Web UI - Audit Trail** (apps/web/src/modules/governance/)

- [ ] T139 [P] [US4] Add governanceStore.fetchRevisions action in apps/web/src/modules/governance/stores/governance-store.ts
- [ ] T140 [US4] Implement RevisionHistoryView component with timeline in apps/web/src/modules/governance/views/RevisionHistoryView.vue
- [ ] T141 [US4] Add RevisionCard component showing author/timestamp/changes in apps/web/src/modules/governance/components/RevisionCard.vue
- [ ] T142 [US4] Wire RevisionHistoryView to router in apps/web/src/router/governance-routes.ts

**Checkpoint**: User Story 4 complete - RBAC enforced, audit trail visible

---

## Phase 10: Desktop UI (Optional - Post-MVP)

**Goal**: Provide desktop app support for offline rule browsing (React in Electron renderer)

**Independent Test**: Desktop app can list, filter, and view rules with same functionality as web

### Implementation for Desktop UI (Optional)

- [ ] T143 [P] Create Zustand governanceStore in apps/desktop/src/renderer/stores/governance-store.ts
- [ ] T144 [P] Implement RuleListView component (React) in apps/desktop/src/renderer/views/RuleListView.tsx
- [ ] T145 [P] Implement RuleDetailView component (React) in apps/desktop/src/renderer/views/RuleDetailView.tsx
- [ ] T146 [P] Add RuleCard component with shadcn/ui in apps/desktop/src/renderer/components/RuleCard.tsx
- [ ] T147 [P] Add CodeSnippetView component with syntax highlighting in apps/desktop/src/renderer/components/CodeSnippetView.tsx
- [ ] T148 Wire desktop views to Electron router in apps/desktop/src/renderer/router.tsx

**Checkpoint**: Desktop UI complete (optional)

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T149 [P] Create 5 seed rules (Entity Props Pattern, No Logic in DTOs, Layer Isolation, Value Object Collections, Factory Method Pattern) in packages/governance/src/infrastructure/seed-data.ts
- [ ] T150 [P] Implement seed script execution in packages/governance/package.json scripts
- [ ] T151 Run dogfooding compliance checklist from quickstart.md against governance source code
- [ ] T152 [P] Add API error handling for duplicate codes, invalid transitions in apps/api/src/modules/governance/routes/governance-crud.routes.ts
- [ ] T153 [P] Add performance monitoring for search (<200ms) and detail view (<500ms) in apps/web/src/modules/governance/composables/use-performance-monitor.ts
- [ ] T154 [P] Update main documentation index in docs/README.md to reference governance module
- [ ] T155 [P] Create governance module user guide in docs/modules/governance/user-guide.md
- [ ] T156 Code cleanup: Remove unused imports, fix linting issues across governance package
- [ ] T157 Security review: Validate RBAC middleware, check for SQL injection risks in search
- [ ] T158 [P] Add keyboard shortcuts (j/k for navigation) in apps/web/src/modules/governance/views/GovernanceListView.vue

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **US5 Package Restructuring (Phase 3)**: Depends on Foundational completion - BLOCKS all feature implementation
- **US2 Foundation Domain (Phase 4)**: Depends on US5 completion - BLOCKS all other user stories (provides Rule entity)
- **US2 Application/Infra (Phase 5)**: Depends on Phase 4 (domain layer)
- **US2 API/Editor (Phase 6)**: Depends on Phase 5 (application services)
- **US1 Discovery UI (Phase 7)**: Depends on Phase 4 (domain) and Phase 6 (API) - Can run parallel with US3/US4 if staffed
- **US3 Search (Phase 8)**: Depends on Phase 4 (domain) and Phase 5 (repository) - Can run parallel with US1/US4
- **US4 RBAC/Audit (Phase 9)**: Depends on Phase 6 (API layer) - Can run parallel with US1/US3
- **Desktop UI (Phase 10)**: Depends on Phase 6 (API layer) - Fully independent, can run anytime after API complete
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US5 (Package Restructuring)**: No dependencies - Prerequisite for ALL features
- **US2 (Rule Management)**: Depends on US5 - Provides foundation for US1/US3/US4
- **US1 (Pattern Discovery)**: Depends on US2 domain + API - Independent of US3/US4
- **US3 (Search)**: Depends on US2 foundation - Independent of US1/US4
- **US4 (RBAC/Audit)**: Depends on US2 API - Independent of US1/US3

### Critical Path (MVP)

For minimum viable product delivering core value (30-second pattern discovery):

1. Setup → Foundational → US5 (Package) → US2 Domain → US2 App/Infra → US2 API → US1 Discovery UI

**Estimated Critical Path**: ~18-24 hours of implementation time

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Contracts before domain-shared before domain-server
- Value objects before aggregates
- Aggregates before entities
- Domain before application
- Application before infrastructure
- Infrastructure before API
- API before UI
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

**Within Setup/Foundational (Phases 1-2)**:
- All tasks marked [P] can run simultaneously

**Within US5 (Phase 3 - Package Restructuring)**:
- T018, T019, T020 (import updates in apps) can run parallel after T017

**Within US2 Domain (Phase 4)**:
- All contracts (T030-T036) can run parallel
- All value objects (T037-T041) can run parallel after contracts
- All tests (T024-T029) can run parallel

**Within US2 Application (Phase 5)**:
- All DTOs (T058-T062) can run parallel
- T068, T069 (RevisionService, Mapper) can run parallel with main service
- T080 (PersistenceMapper) can run parallel with repository methods

**Within US2 API (Phase 6)**:
- T084, T085 (Zod schemas) can run parallel
- T091 (revisions route) can run parallel with main CRUD routes
- All web UI components (T097-T102) can be split across developers

**Across User Stories (after US2 API complete)**:
- **US1 (Discovery)**, **US3 (Search)**, **US4 (RBAC)** can ALL proceed in parallel with separate teams:
  - Team A: US1 Discovery UI (Phase 7)
  - Team B: US3 Search implementation (Phase 8)
  - Team C: US4 RBAC enforcement (Phase 9)

**Within Polish (Phase 11)**:
- All tasks marked [P] (T149, T150, T152-T158) can run simultaneously

---

## Parallel Example: After US2 API Complete

```bash
# Team A: Implements US1 Discovery UI
git checkout -b feat/us1-discovery-ui
# Work on T105-T117 (GovernanceListView, GovernanceDetailView, components)

# Team B: Implements US3 Search
git checkout -b feat/us3-search
# Work on T120-T131 (RuleSearchApplicationService, search routes, SearchBar)

# Team C: Implements US4 RBAC/Audit
git checkout -b feat/us4-rbac-audit
# Work on T134-T142 (RBAC verification, RevisionHistoryView)

# All teams merge independently when complete
```

---

## Implementation Strategy

### MVP Scope (Recommended)

For fastest time-to-value delivering core success criteria (SC-001: 30-second discovery, SC-002: 5-minute scaffolding):

**Include**:
- Phase 1: Setup
- Phase 2: Foundational
- Phase 3: US5 Package Restructuring
- Phase 4-6: US2 Rule Management (full CRUD)
- Phase 7: US1 Pattern Discovery UI
- Phase 11: Seed rules (T149-T150)

**Defer to Post-MVP**:
- US3 Search (manual tag filtering sufficient initially)
- US4 RBAC/Audit (can use basic auth initially)
- Desktop UI (web-first approach)

**Rationale**: US5 + US2 + US1 + Seed content enables the core value loop: Engineers browse rules by tag → find canonical patterns → copy Good Examples → ship compliant code. This achieves SC-001, SC-002, SC-005, SC-007 with minimum scope.

### Incremental Delivery Strategy

1. **Week 1**: Phases 1-3 (Setup, Foundation, Package Rename) → Governance package exists
2. **Week 2**: Phase 4 (US2 Domain) → Business rules enforced
3. **Week 3**: Phases 5-6 (US2 App/API/Editor) → Tech Leads can create rules
4. **Week 4**: Phase 7 (US1 Discovery UI) + Seed content → Engineers can browse and discover
5. **Post-MVP**: Add US3 (Search), US4 (RBAC), Desktop as needed

### Dogfooding Validation

Before merging to main, verify ALL 12 patterns from constitution check:

1. Props Object Pattern - Rule aggregate constructor ✓
2. Private constructors + factory methods - All domain objects ✓
3. Private backing fields + readonly getters - Entity properties ✓
4. Const object enums - RuleStatus, RuleSeverity ✓
5. Branded types - RuleId ✓
6. Lifecycle state machine - RuleStatus.canTransitionTo() ✓
7. Immutable audit entity - RuleRevision (no update/delete) ✓
8. Domain events - Rule.addDomainEvent() ✓
9. Repository interface + DI token - IRuleRepository ✓
10. Protocol → API → DTOs layering - governance-rpc-map.ts imports api.ts ✓
11. Zod schemas - CreateRuleSchema, UpdateRuleSchema ✓
12. Result pattern - All domain methods return Result<T> ✓

Run checklist from [quickstart.md](quickstart.md) section "Dogfooding Compliance Checklist" before final review.

---

**Total Tasks**: 158 tasks (73 core implementation, 28 OPTIONAL tests, 57 supporting tasks)

**Estimated Effort**: 
- MVP (US5 + US2 + US1): ~80 tasks, 18-24 hours
- Full Implementation (all user stories): ~130 tasks, 30-40 hours
- With comprehensive testing: ~158 tasks, 40-50 hours

**Command to proceed**: Begin with Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US5 Package Restructuring)
