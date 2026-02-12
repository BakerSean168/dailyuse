# Feature Specification: Governance Module

**Feature Branch**: `001-governance-module`  
**Created**: 2026-02-08  
**Status**: Draft  
**Input**: User description: "删除新创建的 governance package，把 example-sample 包改名为 governance，并在此基础上，根据 prd 创建一个 governance 模块"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - New Hire Finds Canonical Pattern and Ships Compliant Code (Priority: P1)

A junior engineer, newly onboarded, receives a ticket to implement a new DDD Entity. They open the Governance module UI, filter rules by the "#ddd" and "#entity" tags, and find the "Entity Props Pattern" rule (e.g., DDD-001). The rule shows a side-by-side view of a Bad Example (anti-pattern) and a Good Example (canonical implementation), plus a link to the living reference in the monorepo. The engineer copies the Good Example structure, adapts it for their entity, and ships a compliant implementation on the first attempt — without needing verbal guidance from senior team members.

**Why this priority**: This is the core value proposition. If a new hire can self-serve correct architectural patterns, the module justifies its existence. Every other feature builds on this foundation of browsable, example-rich rules.

**Independent Test**: Can be fully tested by seeding 5 rules with tags and examples, then verifying a user can browse, filter, and view rule details with syntax-highlighted code snippets.

**Acceptance Scenarios**:

1. **Given** at least 5 seeded rules exist with tags and Good/Bad examples, **When** a user filters rules by the tag "ddd", **Then** all rules tagged "ddd" are displayed in a list grouped by tag.
2. **Given** a rule has a GoodExample and a BadExample, **When** a user opens the rule detail view, **Then** both code snippets are displayed with syntax highlighting and clearly labeled as "Good" and "Bad".
3. **Given** a rule links to a live reference location in the monorepo, **When** a user views the rule, **Then** a navigable link to the source code location is shown.
4. **Given** a user is browsing rules, **When** they search by keyword "props pattern", **Then** matching rules are returned in the results.

---

### User Story 2 - Tech Lead Creates and Manages Architectural Rules (Priority: P2)

A tech lead is tired of repeating the same architecture corrections in pull request reviews. They open the Governance module, create a new rule with a unique code (e.g., ARCH-002), title, description, severity (MANDATORY), tags, and Good/Bad code examples. The system validates all inputs, normalizes tags to lowercase kebab-case, and enforces the unique rule code constraint. The rule is saved with an initial revision record for auditability. Later, the tech lead updates the rule's description and the system creates another immutable revision entry tracking the change.

**Why this priority**: Without the ability to create and manage rules, the module has no content beyond seeds. This is the authoring backbone that enables all discovery scenarios.

**Independent Test**: Can be fully tested by verifying CRUD operations on rules, validation of domain constraints (unique code, tag normalization, lifecycle transitions), and confirming revision records are created on each change.

**Acceptance Scenarios**:

1. **Given** a user with Tech Lead/Architect role, **When** they create a rule with code, title, description, severity, status, tags, and at least one Good and one Bad example, **Then** the rule is persisted and a RuleRevision record is created.
2. **Given** a rule with code "DDD-001" already exists, **When** a user attempts to create another rule with code "DDD-001", **Then** the system rejects the creation with a validation error indicating the code is already taken.
3. **Given** a tag " My Tag " is provided, **When** the rule is saved, **Then** the tag is normalized to "my-tag" (lowercase, trimmed, kebab-case).
4. **Given** a MANDATORY rule, **When** a user attempts to deprecate it directly, **Then** the system rejects the action and requires the severity to be downgraded to RECOMMENDED first.
5. **Given** a rule is being deprecated, **When** the user submits the deprecation, **Then** the system requires a non-empty deprecation reason.

---

### User Story 3 - Senior Developer Resolves Pattern Writer's Block (Priority: P3)

A senior engineer is implementing a Value Object collection pattern for a Payment aggregate and cannot remember the canonical approach. They open the Governance module and search for "collection". The search returns the relevant rule (e.g., DDD-005 "Value Object Collections") with a precise Good Example. The engineer copies and adapts the pattern in under a minute. If the rule is DEPRECATED, a visible warning is displayed with a link to the replacement rule.

**Why this priority**: This validates the search and discovery UX for experienced engineers. While P1 covers browsing/filtering, this story validates keyword search and deprecation visibility — important for daily use adoption.

**Independent Test**: Can be fully tested by creating rules with varying statuses (Active, Deprecated) and verifying keyword search returns relevant results with correct status indicators and deprecation warnings.

**Acceptance Scenarios**:

1. **Given** a rule titled "Value Object Collections" is Active, **When** a user searches for "collection", **Then** the rule appears in results.
2. **Given** a rule is DEPRECATED with a reason and replacement link, **When** a user views the rule, **Then** a warning is displayed showing the deprecation reason and a link to the replacement rule.
3. **Given** rules in different statuses (Draft, Active, Deprecated), **When** a user filters by status "Active", **Then** only Active rules are displayed.

---

### User Story 4 - Rule Lifecycle Governance and Role-Based Access (Priority: P4)

Engineers can read all rules but cannot create or edit published rules. They can propose edits by creating drafts, but only Tech Leads or Architects can publish changes to Active rules. The system enforces lifecycle transition rules: a MANDATORY rule must be downgraded to RECOMMENDED before it can be deprecated. Rule revision history is append-only and tracks who changed what and when.

**Why this priority**: Access control and lifecycle governance ensure content quality and auditability. Without this, anyone could introduce incorrect patterns or bypass the deprecation process.

**Independent Test**: Can be fully tested by verifying role-based permissions on CRUD endpoints and lifecycle state machine transitions.

**Acceptance Scenarios**:

1. **Given** a user with Engineer role, **When** they attempt to create a rule, **Then** the system allows them to save it only in Draft status.
2. **Given** a user with Engineer role, **When** they attempt to publish a Draft rule to Active, **Then** the system rejects the action.
3. **Given** a user with Tech Lead role, **When** they publish a Draft rule, **Then** the rule becomes Active and a RuleRevision record is created.
4. **Given** a rule has been updated 3 times, **When** a Tech Lead views the rule's revision history, **Then** all 3 revisions are displayed with author, timestamp, and change details.

---

### User Story 5 - Package Restructuring: Rename example-sample to governance (Priority: P0)

Before any Governance features can be built, the existing `example-sample` package must be renamed to `governance`. This involves updating the package name, all internal references, Nx project configuration, import paths, and barrel exports. The existing DDD structure (contracts, domain-shared, domain-server, domain-client) is preserved as the foundation for the Governance module. The previously created standalone governance package (if any) must be removed to avoid conflicts.

**Why this priority**: This is a prerequisite for all other stories. No Governance module can exist without the package restructuring being completed first.

**Independent Test**: Can be fully tested by verifying the renamed package builds successfully, all imports resolve, and the Nx project graph recognizes the new package name.

**Acceptance Scenarios**:

1. **Given** the `example-sample` package exists, **When** the restructuring is complete, **Then** a `governance` package exists with the same DDD directory structure (contracts, domain-shared, domain-server, domain-client).
2. **Given** the old governance package was previously created, **When** the restructuring is complete, **Then** the old governance package no longer exists.
3. **Given** the governance package, **When** running the build, **Then** the package compiles without errors.
4. **Given** the governance package, **When** checking the Nx project graph, **Then** the package is recognized as `governance` with correct dependencies.

---

### Edge Cases

- What happens when a user searches with an empty query? The system returns all Active rules (unfiltered browse mode).
- What happens when the only remaining GoodExample on a rule is deleted? The system prevents deletion and shows a validation error requiring at least one GoodExample.
- What happens when a Tech Lead tries to deprecate a MANDATORY rule without first downgrading severity? The system blocks the action and displays a clear error message explaining the required lifecycle transition.
- What happens when a user attempts to hard delete a rule that has revision history? The system prevents deletion and displays an error explaining that rules with revisions cannot be deleted to preserve audit trail integrity.
- What happens when a rule's live reference link points to code that no longer exists? The system flags the rule as "reference needs review" without automatically changing its status.
- What happens when two users concurrently edit the same rule? The system uses optimistic concurrency — the second save fails with a conflict error, prompting the user to refresh and retry.
- What happens when a tag is provided with mixed-case and whitespace? The system normalizes it to lowercase, trimmed, kebab-case before storage.

## Requirements *(mandatory)*

### Functional Requirements

**Package Restructuring**

- **FR-001**: The `example-sample` package MUST be renamed to `governance`, preserving the existing DDD layer structure (contracts, domain-shared, domain-server, domain-client).
- **FR-002**: All internal references, import paths, Nx project configuration, and barrel exports MUST be updated to reflect the new `governance` package name.
- **FR-003**: The previously created standalone governance package (if any) MUST be deleted to avoid conflicts.

**Rule Management**

- **FR-004**: Tech Leads/Architects MUST be able to create a rule with: unique code, title, description, severity (Mandatory/Recommended), status (Draft/Active/Deprecated), tags, and at least one Good and one Bad example.
- **FR-005**: Tech Leads/Architects MUST be able to update rule content (description, examples, metadata, severity, tags).
- **FR-006**: Tech Leads/Architects MUST be able to change rule status following valid lifecycle transitions: Draft → Active (publish), Active → Deprecated (retire), Deprecated → Active (reactivate). Direct Draft → Deprecated is not allowed.
- **FR-007**: System MUST enforce rule lifecycle transitions: MANDATORY rules cannot be deprecated directly — severity must first be downgraded to RECOMMENDED.
- **FR-008**: System MUST require a non-empty deprecation reason when deprecating a rule, with an optional link to a replacement rule.
- **FR-009**: System MUST enforce unique Rule.code across all rules.
- **FR-010**: System MUST normalize tags to lowercase, trimmed, kebab-case before storage.

**Rule Content and Examples**

- **FR-011**: Authors MUST be able to attach one or more GoodExample code snippets to a rule.
- **FR-012**: Authors MUST be able to attach one or more BadExample code snippets to a rule.
- **FR-013**: System MUST require at least one GoodExample and at least one BadExample for a rule to be valid.
- **FR-014**: Users MUST be able to view GoodExample and BadExample code snippets side by side with clear labeling.

**Rule Deletion**

- **FR-032**: System MUST allow hard deletion only for Draft rules that have no RuleRevision records.
- **FR-033**: System MUST prevent hard deletion of rules with existing RuleRevision records to preserve audit trail integrity.
- **FR-034**: Deprecated rules MUST serve as soft-delete/archive state — hidden from default UI views but preserved in database.

**Discovery and Search**

- **FR-015**: Users MUST be able to browse rules grouped or filtered by tag.
- **FR-016**: Users MUST be able to search rules by keyword (matches against title, description, code, tags).
- **FR-035**: Search results MUST be ordered by relevance scoring: match quality (title exact match highest, then title partial, code, description, tags) combined with status weighting (Active rules ranked above Draft, Draft above Deprecated).
- **FR-017**: Users MUST be able to filter rules by status (Draft, Active, Deprecated).
- **FR-018**: Users MUST be able to filter rules by severity (Mandatory, Recommended).

**Living Reference**

- **FR-019**: Each rule MUST support an optional link to a live reference code location in the monorepo.
- **FR-020**: Users MUST be able to navigate from a rule to its live reference.
- **FR-021**: System MUST be able to flag rules whose live reference is missing or has changed (reference needs review).
- **FR-036**: System SHOULD provide a scheduled job that checks file existence for all live reference links and flags rules with missing references.
- **FR-037**: Tech Leads/Architects MUST be able to manually mark rules as "reference needs review" and clear this flag after verification.
- **FR-038**: Content change detection for live references MUST be manual — automated hash-based detection is not required in MVP to avoid false positives from code formatting or refactoring.

**Governance and Audit**

- **FR-022**: Every rule change MUST create an immutable RuleRevision record capturing who changed it, when, and what changed.
- **FR-023**: Tech Leads/Architects MUST be able to view rule revision history.
- **FR-024**: Engineers MUST be able to propose edits (save as Draft) but cannot publish changes to Active rules.
- **FR-025**: Only Tech Lead/Architect roles MUST be able to publish changes to Active rules.

**Rendering and Presentation**

- **FR-026**: Rule descriptions MUST render Markdown content.
- **FR-027**: Code snippets MUST render with syntax highlighting for TypeScript, JSON, YAML, and Prisma schema.

**Access Control**

- **FR-028**: All authenticated engineers MUST be able to read rules.
- **FR-029**: Only Admin/Tech Lead/Architect roles MUST be able to create or edit published rules.

**Seed Content**

- **FR-030**: System MUST ship with at least 5 seeded core architectural rules covering patterns such as Entity Props Pattern, No Logic in DTOs, Layer Isolation, Value Object Collections, and Factory Method Pattern.

**Dogfooding**

- **FR-031**: The Governance module source code MUST comply with its own defined rules (Props Object pattern, private constructors, factory methods) as verifiable by its strict linting and architectural rules.

### Key Entities

- **Rule (Aggregate Root)**: The central domain object representing an architectural rule. Key attributes: unique code (e.g., DDD-001), title, description (Markdown), severity (Mandatory/Recommended), status (Draft/Active/Deprecated), deprecation reason, replacement rule link, live reference location, creation/update timestamps, author. Contains a collection of Tags and CodeSnippets.
- **RuleTag (Value Object)**: A normalized label attached to a Rule for categorization. Always stored in lowercase, trimmed, kebab-case. Examples: "ddd", "entity", "value-object", "architecture".
- **CodeSnippet (Value Object)**: A code example attached to a Rule. Attributes: language (TypeScript/JSON/YAML/Prisma), content (source code string), type (GoodExample/BadExample), optional caption/description.
- **RuleRevision (Entity)**: An immutable audit record created on every Rule change. Attributes: revision number, author, timestamp, changed fields, previous values, new values. Append-only — cannot be updated or deleted.
- **RuleStatus (Value Object)**: The lifecycle state of a Rule — Draft, Active, or Deprecated. Enforces valid transitions: Draft → Active (publish), Active → Deprecated (retire, requires RECOMMENDED severity), Deprecated → Active (reactivate). Direct Draft → Deprecated is not allowed.
- **RuleSeverity (Value Object)**: The enforcement level — Mandatory or Recommended. Governs deprecation constraints.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can locate a specific architectural rule and its code example within 30 seconds of opening the Governance module.
- **SC-002**: A new developer can scaffold a standard-compliant Entity by referencing the Governance module patterns within 5 minutes.
- **SC-003**: Architecture-style review comments in pull requests decrease by 50% within 3 months of launch.
- **SC-004**: 100% of new modules created after launch follow the patterns defined in Governance.
- **SC-005**: Governance module source code passes all of the architectural rules it defines (dogfooding compliance).
- **SC-006**: Search results load in under 200 milliseconds, and rule detail views (including syntax-highlighted code snippets) load in under 500 milliseconds.
- **SC-007**: All 5 seeded core rules are present and browsable on first launch.

## Clarifications

### Session 2026-02-08

- Q: Rule Status Lifecycle Transitions — What state transitions are allowed? → A: Reactivation allowed. Forward path: Draft → Active → Deprecated. Backward reactivation: Deprecated → Active is allowed. Draft → Deprecated is not allowed.
- Q: Performance Target Definition — What are the specific response time targets for SC-006? → A: Aggressive PRD targets. Search results in <200ms, rule detail view in <500ms (including syntax highlighting).
- Q: Rule Deletion Behavior — Can rules be permanently deleted, and what happens to child entities? → A: Soft delete (archive) only. Rules with revisions cannot be hard deleted. Draft rules without revisions can be hard deleted. Deprecated status serves as soft-delete/archive — hidden from default UI views but preserved in database.
- Q: Search Result Ordering — How are search results ordered when multiple rules match? → A: Relevance scoring with status priority. Match quality (title exact > title partial > code > description > tags) combined with status weighting (Active > Draft > Deprecated).
- Q: Live Reference Validation Mechanism — Is validation automated or manual? → A: Manual review workflow with optional automated check. Scheduled job checks file existence only. Content change detection is manual. Tech leads periodically review and clear flags.

## Assumptions

- The existing `example-sample` package DDD structure is a suitable foundation for the Governance module and will be preserved during renaming.
- The monorepo uses Nx for project management, and renaming involves updating `project.json`, `package.json`, barrel exports, and any cross-package references.
- RBAC will be enforced at the API level using the existing authentication/authorization infrastructure in the monorepo (e.g., NestJS guards or middleware).
- Syntax highlighting will use a standard library available in the frontend ecosystem the project already uses.
- "Live reference" links are relative monorepo file paths, not absolute URLs, allowing them to be resolved within the development environment.
- Dark mode is the default or primary theme for the UI.
- Keyboard shortcuts (/ for search, j/k or arrows for navigation) are included in the MVP scope for daily-use ergonomics.
