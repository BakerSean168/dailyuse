# Story 1.2: Create Rule with Validation and RBAC

Status: in-progress

## Story

As a Tech Lead or Architect,
I want to create a rule with metadata, tags, and examples,
so that standards are captured with consistent structure.

## Acceptance Criteria

1. Given I am authenticated with Tech Lead or Architect role, when I submit a new rule with code, title, description, severity, status, tags, and examples, then the rule is created and returned with a unique identifier.
2. Given I submit a rule with a duplicate code, when validation runs, then the request fails with a domain validation error and no rule is persisted.
3. Given I submit tags with mixed case or spaces, when the rule is created, then tags are normalized to lowercase, trimmed, kebab-case.
4. Given I submit a rule with invalid inputs (missing required fields, invalid status/severity, or missing examples), when validation runs, then I receive structured validation errors and the rule is not persisted.
5. Given I am authenticated but do not have Tech Lead or Architect role, when I attempt to create a rule, then access is denied.

## Tasks / Subtasks

- [x] Task 1: Define rule contracts and DTOs (AC: 1-4)
  - [x] Add contracts DTOs for create rule payload and response shape under governance contracts
  - [x] Define rule status/severity enums and example DTOs in contracts
- [ ] Task 2: Implement domain model and validation (AC: 1-4)
  - [ ] Add Rule aggregate, RuleTag, CodeSnippet value objects, and validation helpers
  - [ ] Enforce unique code, tag normalization, and Good/Bad example presence in domain rules
- [ ] Task 3: Application service and repository wiring (AC: 1-4)
  - [ ] Add RuleApplicationService create method with Result mapping
  - [ ] Implement governance repository interface and Prisma mapper scaffolding
- [ ] Task 4: API routes and RBAC (AC: 1, 5)
  - [ ] Add POST /rules route in governance CRUD routes
  - [ ] Enforce auth middleware and role checks (Admin/Tech Lead)
  - [ ] Return responses via createResponseBuilder()
- [ ] Task 5: Validation error handling and responses (AC: 2-4)
  - [ ] Map domain validation errors to responseBuilder.error with consistent status codes
  - [ ] Add clear validation messages matching Goal patterns

## Dev Notes

- Use the Goal module as the primary reference for validation approach, response builder usage, and route conventions.
- Validation patterns:
  - Contracts: Goal uses Zod schemas (Create/Update Goal DTOs) in contracts; mirror this approach for Governance create payloads.
  - Domain: Goal aggregate validates in factory methods; implement Rule.create(...) and validate required fields (code, title, description, severity, status, tags, examples).
- RBAC: Reuse Auth module roles (Admin/Tech Lead/Engineer). Only Admin/Tech Lead can create rules. Engineers can read only.
- Responses: Use createResponseBuilder() from @dailyuse/contracts/response as in Goal routes.
- Route style: Express REST, plural nouns, :id params, kebab-case route files under interface/.
- Tag normalization must be enforced in domain (lowercase, trimmed, kebab-case) and returned normalized.
- Examples: Require at least one GoodExample and one BadExample in create payload; store via CodeSnippet value objects.
- Error handling: Map domain Result errors to HTTP with responseBuilder.error and consistent status codes.

### Project Structure Notes

- Governance is a vertical-slice package: packages/governance/src/{contracts,domain,application,infrastructure,interface,module.ts}
- API wiring lives in apps/api/src/modules/governance/interface and uses adapters to packages/governance routes
- Express routes are aggregated in packages/governance/src/interface/express/index.ts and apps/api/src/modules/governance/interface/index.ts
- Response builder is imported from @dailyuse/contracts/response, consistent with Goal module routes

### References

- \_bmad-output/planning-artifacts/epics.md (Epic 1, Story 1.2)
- \_bmad-output/planning-artifacts/prd.md (RBAC, validation, tagging, response builder, examples)
- \_bmad-output/planning-artifacts/architecture.md (module structure, patterns, response format, validation alignment)
- \_bmad-output/implementation-artifacts/1-1-scaffold-governance-module-from-goal-template.md (structure and conventions)

## Dev Agent Record

### Agent Model Used

GPT-5.2-Codex

### Debug Log References

Git log reviewed for recent governance scaffolding context.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- Goal module reference points: createResponseBuilder from @dailyuse/contracts/response; Express REST route style and auth middleware in apps/api/src/modules/goal/interface/goal-crud.routes.ts
- Goal validation approach: Zod schemas in contracts and domain validation in aggregate factory methods
- Added rule create DTOs, enums, and example schemas for governance contracts with tests.
- Added governance vitest configuration and test target; ran `pnpm nx test governance`.
- Refined Rule domain validation, decoupled domain enums from contracts, and expanded domain tests for structured errors.

### File List

- packages/governance/src/contracts/index.ts
- packages/governance/src/contracts/aggregates/index.ts
- packages/governance/src/contracts/aggregates/rule-client.ts
- packages/governance/src/contracts/api/index.ts
- packages/governance/src/contracts/api/rule-crud.dto.ts
- packages/governance/src/contracts/api/**tests**/rule-crud.dto.test.ts
- packages/governance/src/contracts/domain/index.ts
- packages/governance/src/contracts/domain/rule.enums.ts
- packages/governance/src/contracts/dtos/index.ts
- packages/governance/src/contracts/dtos/rule-example.dto.ts
- packages/governance/src/domain/aggregates/**tests**/rule.test.ts
- packages/governance/src/domain/aggregates/index.ts
- packages/governance/src/domain/aggregates/rule.ts
- packages/governance/src/domain/index.ts
- packages/governance/src/domain/rule.enums.ts
- packages/governance/src/domain/value-objects/code-snippet.ts
- packages/governance/src/domain/value-objects/index.ts
- packages/governance/src/domain/value-objects/rule-tag.ts
- packages/governance/project.json
- packages/governance/vitest.config.ts
- \_bmad-output/implementation-artifacts/sprint-status.yaml
