---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
---

# dailyuse - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for dailyuse, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Tech Leads/Architects can create a rule with code, title, description, severity, status, tags, and examples.
FR2: Tech Leads/Architects can update rule content (description, examples, metadata).
FR3: Tech Leads/Architects can archive or deactivate rules.
FR4: System enforces rule lifecycle transitions (MANDATORY to RECOMMENDED to DEPRECATED).
FR5: System requires a non-empty deprecation reason and optional replacement link when deprecating a rule.
FR6: System enforces unique Rule.code across all rules.
FR7: System normalizes tags to lowercase, trimmed, kebab-case.
FR8: Authors can attach at least one GoodExample to a rule.
FR9: Authors can attach at least one BadExample to a rule.
FR10: Users can view GoodExample and BadExample code snippets side by side.
FR11: Users can browse rules by tag.
FR12: Users can search rules by keyword.
FR13: Users can filter rules by status (Draft, Active, Deprecated).
FR14: Users can filter rules by severity (Mandatory, Recommended).
FR15: Users can view a rule's anti-pattern guidance.
FR16: Each rule can link to a live reference code location in the monorepo.
FR17: Users can navigate from a rule to its live reference.
FR18: System can flag rules whose live reference is missing or changed (review needed).
FR19: Every rule change creates an immutable RuleRevision record.
FR20: Tech Leads/Architects can view rule revision history (content and metadata changes).
FR21: Engineers can propose edits in Draft mode.
FR22: Only Tech Leads/Architects can publish changes to Active rules.
FR23: Authenticated engineers can read rules.
FR24: Only Admin/Tech Lead roles can create or edit rules.
FR25: Rule descriptions render Markdown content.
FR26: Code snippets render with syntax highlighting for TypeScript, JSON, YAML, and Prisma schema.
FR27: Users can generate a handbook export of Active rules in Markdown.
FR28: Users can generate a handbook export in PDF.
FR29: System can export rules into a machine-readable format for lint configuration.
FR30: System can expose rules for IDE integration (VS Code extension).
FR31: System ships with at least five seeded core architecture rules.
FR32: Users receive validation feedback when rule inputs violate domain constraints.

### NonFunctional Requirements

NFR1: Search results (tag/keyword filters) load in under 200 ms.
NFR2: Rule detail view (including syntax-highlighted content) loads in under 500 ms.
NFR3: 99.5% availability during business hours.
NFR4: RuleRevision history is append-only and immutable at the application level.
NFR5: Internal access only (VPN/Intranet) with strict RBAC for rule changes.
NFR6: Optimized for 10 to 100 active engineers and 500+ active rules without list-view degradation.
NFR7: Dark mode is mandatory and keyboard navigation is required (/ for search, j/k or arrows for result navigation).
NFR8: Governance codebase must pass all active linting rules and architectural patterns it defines.
NFR9: Cyclomatic complexity for domain logic is capped (e.g., less than 10).

### Additional Requirements

- Starter template: mirror the existing Goal module structure across packages and apps; no external starter.
- Architecture alignment: follow existing DDD layering (contracts -> domain-shared -> domain-server/client -> application -> infrastructure -> apps).
- Backend: Express REST with explicit router/controller/service layering and Result pattern mapping.
- Frontend: Vue 3 Composition API with Goal module state/store conventions.
- Data: Prisma + SQLite for MVP with Prisma Migrate via existing Nx tasks.
- Eventing: internal EventBus with module:action naming (e.g., rule:deprecated).
- RBAC: reuse existing Auth module roles (Admin/Tech Lead/Engineer).
- Audit: append-only RuleRevision persistence with no destructive edits.
- Response format: use createResponseBuilder() from @dailyuse/contracts/response for all API outputs.
- API routes: plural nouns, :id params, kebab-case file names in interface/ and index route aggregation.
- UI structure: apps/web/src/modules/governance/presentation/{stores,views,router,composables,widgets} with Pinia stores and composables orchestration.

### FR Coverage Map

FR1: Epic 1 - Author and govern rules
FR2: Epic 1 - Author and govern rules
FR3: Epic 1 - Author and govern rules
FR4: Epic 1 - Author and govern rules
FR5: Epic 1 - Author and govern rules
FR6: Epic 1 - Author and govern rules
FR7: Epic 1 - Author and govern rules
FR8: Epic 2 - Discover and learn from rules
FR9: Epic 2 - Discover and learn from rules
FR10: Epic 2 - Discover and learn from rules
FR11: Epic 2 - Discover and learn from rules
FR12: Epic 2 - Discover and learn from rules
FR13: Epic 2 - Discover and learn from rules
FR14: Epic 2 - Discover and learn from rules
FR15: Epic 2 - Discover and learn from rules
FR16: Epic 3 - Trust the living references
FR17: Epic 3 - Trust the living references
FR18: Epic 3 - Trust the living references
FR19: Epic 3 - Trust the living references
FR20: Epic 3 - Trust the living references
FR21: Epic 1 - Author and govern rules
FR22: Epic 1 - Author and govern rules
FR23: Epic 1 - Author and govern rules
FR24: Epic 1 - Author and govern rules
FR25: Epic 2 - Discover and learn from rules
FR26: Epic 2 - Discover and learn from rules
FR27: Epic 5 - Export and integrate governance
FR28: Epic 5 - Export and integrate governance
FR29: Epic 5 - Export and integrate governance
FR30: Epic 5 - Export and integrate governance
FR31: Epic 4 - Ship with credible seed content
FR32: Epic 1 - Author and govern rules

## Epic List

### Epic 1: Author and Govern Rules
Users can create, edit, and manage rule lifecycle with enforced constraints and role control.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR21, FR22, FR23, FR24, FR32

### Epic 2: Discover and Learn from Rules
Engineers can quickly find, read, and apply rules with rich content rendering.
**FRs covered:** FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR25, FR26

### Epic 3: Trust the Living References
Users can rely on live code references and immutable audit trails to validate rules over time.
**FRs covered:** FR16, FR17, FR18, FR19, FR20

### Epic 4: Ship with Credible Seed Content
Teams get immediate value via curated seed rules that demonstrate dogfooding.
**FRs covered:** FR31

### Epic 5: Export and Integrate Governance
Teams can generate external artifacts and integrations from the rule set.
**FRs covered:** FR27, FR28, FR29, FR30

## Epic 1: Author and Govern Rules

Users can create, edit, and manage rule lifecycle with enforced constraints and role control.

### Story 1.1: Scaffold Governance Module from Goal Template

As a Tech Lead,
I want the Governance module scaffolded by mirroring the Goal module structure,
So that new governance features follow existing DDD conventions from day one.

**FRs:** FR23, FR24

**Acceptance Criteria:**

**Given** the monorepo is available
**When** the Governance module scaffold is created by copying the Goal module structure
**Then** the expected governance folders exist across contracts, domain, application, infrastructure, and apps
**And** module routing and initialization files are in place following the Goal module conventions

**Technical Notes:**
Follow the starter template decision to mirror the Goal module structure across packages and apps, with Express REST layering and Vue 3 Composition API module layout as defined in architecture.

### Story 1.2: Create Rule with Validation and RBAC

As a Tech Lead or Architect,
I want to create a rule with metadata, tags, and examples,
So that standards are captured with consistent structure.

**FRs:** FR1, FR6, FR7, FR23, FR24, FR32

**Acceptance Criteria:**

**Given** I am authenticated with Tech Lead or Architect role
**When** I submit a new rule with code, title, description, severity, status, tags, and examples
**Then** the rule is created and returned with a unique identifier
**And** tags are normalized to lowercase kebab-case and Rule.code is unique
**And** validation errors are returned when inputs violate domain constraints

**Technical Notes:**
Follow the Goal module structure for domain/application/infrastructure layering, use Express REST with Result pattern mapping and createResponseBuilder() for responses, and reuse the Auth module roles for RBAC. Validation must match the Goal module validation pattern.

### Story 1.3: Update Rule Content

As a Tech Lead or Architect,
I want to update a rule's description, examples, or metadata,
So that standards stay current and accurate.

**FRs:** FR2, FR32

**Acceptance Criteria:**

**Given** a rule exists and I have edit permissions
**When** I update rule fields
**Then** the updated rule is returned and persists the changes
**And** invalid updates return validation feedback without persisting changes

**Technical Notes:**
Use the domain-server aggregate and application service layers as in the Goal module, and map errors through the Result adapters with createResponseBuilder() responses.

### Story 1.4: Enforce Rule Lifecycle Transitions

As a Tech Lead or Architect,
I want lifecycle transitions to be enforced (MANDATORY to RECOMMENDED to DEPRECATED),
So that governance rules cannot be bypassed.

**FRs:** FR4, FR32

**Acceptance Criteria:**

**Given** a rule is MANDATORY
**When** I attempt to deprecate it directly
**Then** the system rejects the transition with a clear validation message
**And** I can deprecate only after downgrading to RECOMMENDED

**Technical Notes:**
Implement lifecycle rules inside domain-server aggregates/value objects following the DDD patterns mirrored from the Goal module. Return errors via Result pattern mapping.

### Story 1.5: Require Deprecation Reason and Replacement Link

As a Tech Lead or Architect,
I want deprecations to require a reason and allow a replacement link,
So that developers know why a rule changed and what to use instead.

**FRs:** FR5, FR32

**Acceptance Criteria:**

**Given** a rule is being deprecated
**When** I submit a deprecation without a reason
**Then** the request is rejected with validation feedback
**And** when I include a reason (and optional replacement link), the deprecation succeeds

**Technical Notes:**
Validation must use the existing Goal module validation library and patterns. Store deprecation metadata within the domain model and persist via Prisma.

### Story 1.6: Archive or Deactivate Rules

As a Tech Lead or Architect,
I want to archive or deactivate a rule,
So that obsolete standards are removed from active lists without deletion.

**FRs:** FR3

**Acceptance Criteria:**

**Given** a rule exists and I have edit permissions
**When** I archive or deactivate the rule
**Then** it is excluded from Active rule listings by default
**And** it remains available for audit and history views

**Technical Notes:**
Use REST routes in apps/api/src/modules/governance/interface with kebab-case filenames, and respond using createResponseBuilder().

### Story 1.7: Draft Proposals and Publish Control

As an Engineer,
I want to propose edits in Draft mode,
So that I can suggest improvements without publishing.

**FRs:** FR21, FR22, FR23

**Acceptance Criteria:**

**Given** I am authenticated as an Engineer
**When** I submit a draft change
**Then** the change is saved as Draft and not published
**And** only Tech Lead or Architect can publish Draft changes to Active

**Technical Notes:**
Enforce RBAC using the existing Auth module role model, and map permissions in the application service layer with Result-based errors.

## Epic 2: Discover and Learn from Rules

Engineers can quickly find, read, and apply rules with rich content rendering.

### Story 2.1: Browse Rules by Tag

As an Engineer,
I want to browse rules grouped by tag,
So that I can quickly narrow to relevant standards.

**FRs:** FR11

**Acceptance Criteria:**

**Given** I am an authenticated engineer
**When** I view the rule list
**Then** rules are grouped or filterable by tag
**And** the list loads within 200 ms for common tag filters

**Technical Notes:**
Use Vue 3 Composition API with Pinia store patterns mirrored from the Goal module, and expose REST endpoints via Express with Result pattern mapping.

### Story 2.2: Search Rules by Keyword

As an Engineer,
I want to search rules by keyword,
So that I can find specific standards quickly.

**FRs:** FR12

**Acceptance Criteria:**

**Given** I enter a keyword query
**When** I submit the search
**Then** matching rules are returned and rendered
**And** search results load within 200 ms for typical queries

**Technical Notes:**
Implement search in application-server services using existing repository patterns, and keep API responses in createResponseBuilder() format.

### Story 2.3: Filter by Status and Severity

As an Engineer,
I want to filter rules by status and severity,
So that I can prioritize mandatory standards.

**FRs:** FR13, FR14

**Acceptance Criteria:**

**Given** I apply status and severity filters
**When** the filter is applied
**Then** only matching rules are shown
**And** filter state is preserved in the view while navigating

**Technical Notes:**
Store filter state in the governance Pinia store, and keep routes wired through the module router conventions defined in the Goal module.

### Story 2.4: View Rule Detail with Markdown and Examples

As an Engineer,
I want to view a rule with Markdown description and Good/Bad examples,
So that I can apply the pattern correctly.

**FRs:** FR8, FR9, FR10, FR25, FR26

**Acceptance Criteria:**

**Given** I open a rule detail view
**When** the rule loads
**Then** the description renders as Markdown and Good/Bad examples display side by side
**And** syntax highlighting supports TypeScript, JSON, YAML, and Prisma schema
**And** the detail view renders in under 500 ms

**Technical Notes:**
Follow the UI structure in apps/web/src/modules/governance/presentation with Vue 3 Composition API; keep state in Pinia stores and orchestrate async calls via composables per Goal module patterns.

### Story 2.5: Show Anti-Pattern Guidance

As an Engineer,
I want to see anti-pattern guidance for a rule,
So that I understand what to avoid.

**FRs:** FR15

**Acceptance Criteria:**

**Given** a rule has anti-pattern guidance
**When** I view the rule detail
**Then** the anti-pattern guidance is displayed prominently near the examples

**Technical Notes:**
Render anti-pattern content in the rule detail view using the existing UI conventions and API response formatting via createResponseBuilder().

## Epic 3: Trust the Living References

Users can rely on live code references and immutable audit trails to validate rules over time.

### Story 3.1: Link to Live Reference Code

As an Engineer,
I want each rule to link to a live reference code location,
So that I can copy the canonical implementation.

**FRs:** FR16, FR17

**Acceptance Criteria:**

**Given** a rule includes a live reference link
**When** I click the reference
**Then** I am routed to the referenced code location or repository link

**Technical Notes:**
Store live reference metadata in the domain model and deliver it via REST routes that follow the module:action EventBus naming for lifecycle events when updated.

### Story 3.2: Flag Missing or Changed References

As a Tech Lead or Architect,
I want the system to flag rules with missing or changed references,
So that standards remain trustworthy.

**FRs:** FR18

**Acceptance Criteria:**

**Given** a rule reference is missing or has changed
**When** the system checks references
**Then** the rule is flagged for review
**And** the flag is visible in rule listings and details

**Technical Notes:**
Implement checks using application services and publish domain events via the internal EventBus with module:action naming (e.g., rule:reference-flagged).

### Story 3.3: Record Immutable Rule Revisions

As a Tech Lead or Architect,
I want every rule change to create a RuleRevision record,
So that audit history is append-only and immutable.

**FRs:** FR19

**Acceptance Criteria:**

**Given** any rule create or update operation
**When** the change is persisted
**Then** a RuleRevision record is created with who, when, and what changed
**And** no destructive edits to history are possible

**Technical Notes:**
Persist RuleRevision via infrastructure-server repositories using Prisma + SQLite, and enforce append-only behavior in application services.

### Story 3.4: View Rule Revision History

As a Tech Lead or Architect,
I want to view rule revision history,
So that I can audit content and metadata changes.

**FRs:** FR20

**Acceptance Criteria:**

**Given** a rule has revisions
**When** I open the revision history view
**Then** I can see a chronological list of revisions with key changes

**Technical Notes:**
Expose revision routes via governance-revision.routes.ts and return responses through createResponseBuilder() following the Result pattern.

## Epic 4: Ship with Credible Seed Content

Teams get immediate value via curated seed rules that demonstrate dogfooding.

### Story 4.1: Seed Core Architecture Rules

As a Tech Lead,
I want the system to ship with at least five core rules,
So that engineers can immediately reference canonical patterns.

**FRs:** FR31

**Acceptance Criteria:**

**Given** a fresh environment
**When** the Governance module is initialized
**Then** at least five seeded rules are available in the rule list
**And** each seeded rule includes Good and Bad examples

**Technical Notes:**
Seed data should follow the same Prisma schema and module structure used by the Goal module, and be initialized via the module initialization pattern in apps/api/src/modules/governance/initialization.

## Epic 5: Export and Integrate Governance

Teams can generate external artifacts and integrations from the rule set.

### Story 5.1: Export Active Rules to Markdown Handbook

As a Tech Lead or Architect,
I want to export Active rules to a Markdown handbook,
So that standards can be shared outside the app.

**FRs:** FR27

**Acceptance Criteria:**

**Given** I request a handbook export
**When** the export completes
**Then** a Markdown file is generated containing all Active rules
**And** content uses the same data fields shown in the UI

**Technical Notes:**
Implement export in application-server services and expose via Express REST routes with Result pattern mapping and createResponseBuilder() responses.

### Story 5.2: Export Active Rules to PDF

As a Tech Lead or Architect,
I want to export Active rules to PDF,
So that standards can be distributed in a portable format.

**FRs:** FR28

**Acceptance Criteria:**

**Given** I request a PDF export
**When** the export completes
**Then** a PDF file is generated from Active rules

**Technical Notes:**
Keep the export API consistent with the Markdown export route format and response schema from createResponseBuilder().

### Story 5.3: Export Rules to Machine-Readable Lint Config

As a Tech Lead,
I want to export rules to a machine-readable format,
So that linting tools can consume governance standards.

**FRs:** FR29

**Acceptance Criteria:**

**Given** I request a lint config export
**When** the export completes
**Then** a JSON-compatible artifact is generated for tool consumption

**Technical Notes:**
Follow the contracts DTO conventions for data exchange and keep API responses in createResponseBuilder() format.

### Story 5.4: Expose Rules for IDE Integration

As an Engineer,
I want rules exposed via an integration endpoint,
So that IDE tooling can surface standards in-context.

**FRs:** FR30

**Acceptance Criteria:**

**Given** IDE tooling requests governance rules
**When** it queries the integration endpoint
**Then** it receives a structured payload suitable for IDE consumption

**Technical Notes:**
Expose an API endpoint aligned with existing module route conventions and Express REST layering, and ensure payloads match contracts and Result pattern responses.
