---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
inputDocuments:
  - docs/business-process-flows.md
  - docs/deep-dive-refactored-core-packages.md
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 0
  projectDocs: 2
classification:
  projectType: developer_tool
  domain: general
  complexity: medium
  projectContext: brownfield
---

# Product Requirements Document - dailyuse

**Author:** Baker  
**Date:** 2026-02-07

## Executive Summary
The Governance module is a living constitution for the monorepo. It dogfoods the refactored DDD architecture and turns standards into managed, versioned, and executable rules. Its core value is removing architectural drift and tribal knowledge by letting engineers copy canonical, working code patterns directly from the module itself. Primary users are engineers and tech leads; success is measured by faster onboarding, fewer architecture review comments, and high compliance across new modules.

## Success Criteria

### User Success
- Aha moment: A developer finds the Governance module's own Rule entity and realizes it is the canonical, copyable DDD example.
- Pattern retrieval: Developers can locate a specific architectural rule plus its code example within 30 seconds.
- Implementation speed: A new developer can scaffold a standard-compliant Entity (Props Object pattern) within 5 minutes by referencing the Governance module.

### Business Success
- Architectural drift reduction: 50% fewer code review comments related to architectural style or folder structure within 3 months.
- Onboarding outcome: New engineers commit their first compliant feature without verbal explanations of folder structure or naming conventions.
- Adoption threshold: 100% of new modules created after launch follow the patterns defined in Governance.

### Technical Success
- Dogfooding compliance: Governance module source code passes 100% of the strict linting and architectural rules it defines (e.g., factory methods in Entities).
- Export reliability: Generate README.md or CONTRIBUTING.md from database content with zero manual formatting.

### Measurable Outcomes
- 30-second rule discovery time (rule + example).
- 5-minute time-to-scaffold for a compliant Entity.
- 50% reduction in architecture-style review comments in 3 months.
- 100% compliance for new modules post-launch.

## Product Scope

### MVP - Minimum Viable Product
**Goal:** Prove dogfooding and provide a central reference for standards.

**Backend**
- Rule Aggregate Root (CRUD) with strict DDD implementation (Props Object, private constructor).
- RuleTag and CodeSnippet value objects.
- Basic domain services (e.g., RuleDuplicationService).
- Repository implementation (SQLite/Prisma).

**Frontend (Web/Electron)**
- Read-only view of rules grouped by tags.
- Syntax highlighting for code snippets (Good vs Bad examples).
- Search and filter by tag.

**Data**
- Seed at least 5 core architectural rules (e.g., Entity Props Pattern, No Logic in DTOs).

### Growth Features (Post-MVP)
**Goal:** Integrate into workflow and automate documentation.

- Export feature: Generate Handbook to compile all Active rules into Markdown or PDF.
- Version history: Track rule changes (who, what, why).
- Interactive snippet playground (optional).

### Vision (Future)
**Goal:** Active enforcement and ecosystem integration.

- Linter config generation from structured rules.
- CLI integration: nx run governance:check for project structure validation.
- IDE extension: pull Good Examples into VS Code autocomplete.

## User Journeys

### Journey 1: The New Hire's First Ticket (Onboarding)
**User:** Alex, Junior Engineer (joined 3 days ago).  
**Opening scene:** Assigned "Add a Comment entity to the Blog module" and anxious about DDD expectations.  
**Rising action:** Filters by #DDD and #Entity, finds "Entity Props Pattern (DDD-001)."  
**Climax:** Sees Bad vs Good example and a link to the live Rule entity.  
**Resolution:** Copies the structure, implements Comment, ships with confidence.  
**Edge case:** Spots "No DTOs in Domain" (DDD-003) and fixes the constructor before pushing.

### Journey 2: The Architect's PR Review (Maintenance and Education)
**User:** Sarah, Tech Lead.  
**Opening scene:** Tired of repeating architecture corrections in PRs.  
**Rising action:** Creates "Layer Isolation (ARCH-002)" with a short example.  
**Climax:** System validates and activates the rule at MANDATORY severity.  
**Resolution:** Comments with a rule link; the developer fixes quickly.  
**Edge case:** Deprecation is blocked until severity is downgraded first.

### Journey 3: The Feature Developer's Writer's Block (Daily Use)
**User:** Mike, Senior Engineer.  
**Opening scene:** Needs Value Object collection pattern for a Payment aggregate.  
**Rising action:** Searches "Collection" in Governance app.  
**Climax:** Finds "Value Object Collections (DDD-005)" with a precise example.  
**Resolution:** Copies and adapts in under a minute.  
**Edge case:** Rule is DEPRECATED; warning points to the replacement pattern.

### Journey Requirements Summary
- Search and filter by tag and keyword must be fast and accurate.
- Rules must contain Good vs Bad examples with syntax highlighting.
- Each rule must link to its living, canonical code example.
- Rule status and severity must enforce lifecycle rules (e.g., deprecation constraints).
- Anti-pattern guidance must be first-class, not hidden.
- Desktop and web access required for daily use.

## Domain-Specific Requirements

### Compliance and Internal Governance
- Dogfooding prime directive: Governance module source code must comply with its own rules (Props Object pattern, private constructors, factory methods). Violations are critical failures.
- Rule lifecycle constraint: A MANDATORY rule cannot be deprecated directly; it must first be downgraded to RECOMMENDED.
- Deprecation requires a non-empty reason and optionally a link to a replacement rule.
- Rule code uniqueness: Rule.code (e.g., DDD-001) must be unique.
- Tag normalization: tags stored in lowercase, trimmed, kebab-case to prevent fragmentation.

### Technical Constraints
- Immutable audit history: every change to rule content or metadata creates a RuleRevision record.
- Auditability: must answer who changed a rule, when, and what changed.
- RBAC: read for all engineers; write/edit only Tech Lead or Architect; engineers can propose edits (draft) but cannot publish.

### Integration Requirements
- MVP: syntax highlighting for TypeScript, JSON, YAML; Markdown rendering for rule descriptions.
- Vision: repository deep links for live references; linter export into ESLint-compatible JSON.

### Risk Mitigations
- Stale or incorrect rules: link to live reference code; scheduled job flags rules whose references are missing or changed.
- Rigidity risk: rule exception process field with required approval path.

## Innovation & Novel Patterns

### Detected Innovation Areas
- Governance as Executable Standards: rules are data with lifecycle, enforcement, and live code references.
- Living Code as the Standard: the module's own code is the canonical example; documentation is generated from it.
- Rules as Generators: standards emit artifacts (docs, lint rules, CLI checks), turning governance into tooling.

### Market Context & Competitive Landscape
- Traditional documentation is static and decoupled from working code.
- This approach treats standards as living, testable, and exportable artifacts.

### Validation Approach
- Measure reduction in architecture-style review comments vs baseline.
- Track time-to-implementation for new hires (pattern lookup to commit).
- Track adoption of generated artifacts (handbook exports, lint config usage).

### Risk Mitigation
- If Executable Standards adoption is weak, fallback to Best Practice Reference while retaining search and export value.

## Developer Tool Specific Requirements

### Project-Type Overview
- Internal governance module built in TypeScript (NestJS backend, React frontend).
- Lives as an internal Nx library at packages/modules/governance; not a public npm package.

### Technical Architecture Considerations
- UI is the primary interface (web/desktop) in MVP; no IDE integration required initially.
- CodeSnippet rendering supports TypeScript, JSON, YAML, and Prisma schema (SQL).

### Documentation and Output
- MVP: dynamic web UI rendering with Markdown descriptions and syntax-highlighted code blocks.
- Growth: export to handbook (single CONTRIBUTING.md or PDF).

### Example Quality Requirements
- Every rule must include at least one GoodExample and one BadExample to be valid.

### Implementation Considerations
- Internal consumption only; no public package distribution.
- Future vision: VS Code extension for inline rules and click-through to Governance app.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy
**MVP Approach:** Problem-solving MVP - prove dogfooding works and unblock engineers on "how do I implement this pattern correctly?"  
**Resource Requirements:** 1 senior full-stack engineer (DDD expert) and 1 tech lead part-time for seed rules and content quality.

### MVP Feature Set (Phase 1)
**Core User Journeys Supported:**
- New hire finds a canonical pattern and ships compliant code.
- Architect creates/updates a rule and uses it in PR feedback.
- Senior dev resolves pattern writer's block quickly.

**Must-Have Capabilities:**
- Rule CRUD with lifecycle constraints (MANDATORY to RECOMMENDED to DEPRECATED).
- Good/Bad examples with syntax highlighting.
- Tagging and search/filter.
- Seed at least 5 core rules at launch.
- Basic RBAC (Admin write vs User read at API level).
- RuleRevision audit logging (backend only; UI deferred).

### Post-MVP Features
**Phase 2 (Post-MVP):**
- Export to Handbook (CONTRIBUTING.md or PDF).
- Rule history UI and diff views.
- Stronger relevance ranking for search results.

**Phase 3 (Expansion):**
- Desktop app-specific UX enhancements.
- IDE extension and inline rule suggestions.
- Linter config generation and CLI checks.

### Risk Mitigation Strategy
**Technical Risks:** Dogfooding constraints could introduce circular dependencies. Mitigate by explicit module boundaries and validation in tests.  
**Market Risks:** Slow or irrelevant search will kill adoption. Mitigate by performance budgets and relevance tuning.  
**Resource Risks:** If capacity is tight, cut audit log UI and desktop-specific wrappers first.

## Functional Requirements

### Rule Management
- FR1: Tech Leads/Architects can create a rule with code, title, description, severity, status, tags, and examples.
- FR2: Tech Leads/Architects can update rule content (description, examples, metadata).
- FR3: Tech Leads/Architects can archive or deactivate rules.
- FR4: System enforces rule lifecycle transitions (MANDATORY to RECOMMENDED to DEPRECATED).
- FR5: System requires a non-empty deprecation reason and optional replacement link when deprecating a rule.
- FR6: System enforces unique Rule.code across all rules.
- FR7: System normalizes tags to lowercase, trimmed, kebab-case.

### Rule Content and Examples
- FR8: Authors can attach at least one GoodExample to a rule.
- FR9: Authors can attach at least one BadExample to a rule.
- FR10: Users can view GoodExample and BadExample code snippets side by side.

### Discovery and Learning
- FR11: Users can browse rules by tag.
- FR12: Users can search rules by keyword.
- FR13: Users can filter rules by status (Draft, Active, Deprecated).
- FR14: Users can filter rules by severity (Mandatory, Recommended).
- FR15: Users can view a rule's anti-pattern guidance.

### Living Reference and Dogfooding
- FR16: Each rule can link to a live reference code location in the monorepo.
- FR17: Users can navigate from a rule to its live reference.
- FR18: System can flag rules whose live reference is missing or changed (review needed).

### Governance and Audit
- FR19: Every rule change creates an immutable RuleRevision record.
- FR20: Tech Leads/Architects can view rule revision history (content and metadata changes).
- FR21: Engineers can propose edits in Draft mode.
- FR22: Only Tech Leads/Architects can publish changes to Active rules.

### Access Control
- FR23: Authenticated engineers can read rules.
- FR24: Only Admin/Tech Lead roles can create or edit rules.

### Rendering and Presentation
- FR25: Rule descriptions render Markdown content.
- FR26: Code snippets render with syntax highlighting for TypeScript, JSON, YAML, and Prisma schema.

### Export and Artifacts (Post-MVP)
- FR27: Users can generate a handbook export of Active rules in Markdown.
- FR28: Users can generate a handbook export in PDF.

### Future Integrations (Vision)
- FR29: System can export rules into a machine-readable format for lint configuration.
- FR30: System can expose rules for IDE integration (VS Code extension).

### Seed Content
- FR31: System ships with at least five seeded core architecture rules.

### Error and Validation Feedback
- FR32: Users receive validation feedback when rule inputs violate domain constraints.

## Non-Functional Requirements

### Performance
- Search results (tag/keyword filters) load in under 200 ms.
- Rule detail view (including syntax-highlighted content) loads in under 500 ms.

### Reliability
- 99.5% availability during business hours.
- If Governance is down, development continues; compliance checks may be delayed.

### Security
- RuleRevision history is append-only and immutable at the application level.
- Internal access only (VPN/Intranet) with strict RBAC for rule changes.

### Scalability
- Optimized for 10 to 100 active engineers.
- Handles 500+ active rules without list-view performance degradation.

### Accessibility and Ergonomics
- Dark mode is mandatory.
- Keyboard navigation required: / for search, j/k or arrows for result navigation.

### Maintainability
- Governance codebase must pass all active linting rules and architectural patterns it defines.
- Cyclomatic complexity for domain logic is capped (e.g., less than 10).
