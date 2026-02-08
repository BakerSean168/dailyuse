# Phase 0: Technical Research — Governance Module

**Branch**: `001-governance-module` | **Date**: 2026-02-08  
**Purpose**: Resolve technical unknowns and document architectural decisions before design

## Research Summary

All technical decisions for the Governance module are derived from:
1. Existing monorepo architecture (documented in `_bmad-output/planning-artifacts/architecture.md`)
2. Constitution principles (`.specify/memory/constitution.md`)
3. Reference implementation patterns (`packages/example-sample` → renamed to `packages/governance`)

No unresolved technical unknowns remain. All decisions align with established practices.

---

## Decision 1: Package Structure and Naming

**Decision**: Rename existing `packages/example-sample` to `packages/governance` and build on its DDD foundation.

**Rationale**:
- The `example-sample` package already demonstrates correct DDD layering (contracts, domain-shared, domain-server, domain-client).
- Renaming preserves the working structure while establishing the Governance module as the new canonical example.
- Vertical-slice architecture (all layers in one package) prevents coupling to global shared packages and reduces drift risk.
- Governance can dogfood its own patterns by being the exemplary codebase.

**Alternatives Considered**:
- **Create new standalone `packages/governance`**: Rejected because it would duplicate the example-sample structure and waste the existing foundation.
- **Split across global packages** (domain-server, domain-client, contracts): Rejected per architecture.md guidance to avoid legacy patterns and maintain isolation.
- **Keep example-sample and create separate governance**: Rejected as it undermines the dogfooding principle—Governance IS the example.

---

## Decision 2: Database and ORM Strategy

**Decision**: Use Prisma ORM with SQLite for MVP, with governance-local schema integrated into the main app database.

**Rationale**:
- Prisma is already the standardized ORM across the monorepo (constitution requirement).
- SQLite is lightweight and sufficient for 500+ rules without performance degradation.
- Governance-local schema (`packages/governance/src/infrastructure/prisma/schema.prisma`) keeps the module self-contained during development.
- Schema integrates into main app during assembly (no separate database for MVP).

**Alternatives Considered**:
- **PostgreSQL**: Rejected for MVP. SQLite meets performance goals (<200ms search, <500ms detail view). Can migrate post-MVP if scale demands.
- **In-memory JSON store**: Rejected. Loses audit trail persistence and makes revision history brittle. Not production-ready.
- **Separate database instance**: Rejected for MVP. Adds deployment complexity. Single database with governance tables is simpler.

**Open Question for Implementation**:
Confirm Prisma provider configuration—MVP spec says SQLite, but main app may use PostgreSQL. If conflict exists, use Prisma's `sqlite` provider for governance-local schema and merge into main schema during app assembly.

---

## Decision 3: State Management Strategy

**Decision**: 
- Web: Pinia store (`governanceStore.ts`) following Goal module patterns
- Desktop: React state (Zustand or Context API + hooks) for Electron renderer

**Rationale**:
- Web uses Vue 3 + Pinia per constitution. Must mirror Goal module store conventions (same naming, same action patterns).
- Desktop uses React in renderer process. Zustand is lightweight and type-safe. Context API is fallback if Zustand is not already in use.
- Both stores follow the same shape (rules list, selected rule, isLoading, error) to maintain consistency across platforms.

**Alternatives Considered**:
- **Vuex**: Rejected. Constitution mandates Pinia for Vue 3 state management.
- **Redux (desktop)**: Rejected. Zustand is simpler, less boilerplate, and works well with TypeScript strict mode.
- **Shared state library (mobx)**: Rejected. Multi-platform state sync is not needed for read-heavy Governance module. Each platform manages its own store.

---

## Decision 4: Syntax Highlighting Library

**Decision**: 
- Web: Use existing syntax highlighter if one is present in the codebase; fallback to Prism.js or Shiki.
- Desktop: Prism.js or Shiki (React-compatible).

**Rationale**:
- Feature spec requires highlighting for TypeScript, JSON, YAML, and Prisma schema.
- Performance goal: detail view <500ms including highlighting. Prism.js and Shiki both meet this.
- Shiki is slower but more accurate (uses VS Code themes). Prism.js is faster but requires manual language definitions.
- MVP: Prism.js (faster, simpler). Post-MVP: Can upgrade to Shiki if theme accuracy is prioritized.

**Alternatives Considered**:
- **Monaco Editor**: Rejected. Full editor is overkill for read-only code snippets. Heavy bundle size.
- **Highlight.js**: Considered. Prism.js has better React/Vue integration and smaller bundle size.
- **CodeMirror**: Rejected. Editor-focused, not optimized for static rendering.

**Follow-up Action**:
During Phase 1, check if web app (`apps/web`) already uses a syntax highlighter. Reuse if found to avoid adding new dependencies.

---

## Decision 5: Search and Relevance Ranking Implementation

**Decision**: Implement relevance scoring with weighted match quality: title exact match (highest), title partial, code, description, tags (lowest), combined with status priority (Active > Draft > Deprecated).

**Rationale**:
- Spec clarification Q4 defined this algorithm.
- Engineers expect Active rules to rank higher than Deprecated patterns (even if Deprecated has better keyword match).
- Title exact match optimization: If user searches "Entity Props Pattern" and a rule title matches exactly, surface it first.
- Performance goal (<200ms search) is achievable with SQLite full-text search (FTS5) or in-memory filtering for <500 rules.

**Alternatives Considered**:
- **Alphabetical by rule code**: Rejected. Not user-friendly. Users don't know rule codes (DDD-001) when searching for patterns.
- **Most recently updated first**: Rejected. Recency bias doesn't help pattern discovery. Users want relevance, not novelty.
- **Pure keyword match scorin g (no status weighting)**: Rejected. Would surface Deprecated rules ahead of Active patterns, confusing users.

**Implementation Approach**:
1. For MVP (<500 rules): In-memory filtering + scoring in `RuleSearchApplicationService`.
2. Post-MVP (>500 rules): Switch to SQLite FTS5 or PostgreSQL full-text search with rank weighting.

---

## Decision 6: Rule Lifecycle State Machine Implementation

**Decision**: Implement lifecycle transitions as a method on the `RuleStatus` value object with explicit validation:
- Draft → Active (publish)
- Active → Deprecated (retire, requires RECOMMENDED severity)
- Deprecated → Active (reactivate)
- Direct Draft → Deprecated is blocked

**Rationale**:
- Spec clarification Q1 defined these transitions.
- State machine validation belongs in the domain layer (RuleStatus value object), NOT in application services or API controllers.
- Enforcement happens in `Rule.changeStatus()` method, which calls `RuleStatus.canTransitionTo(newStatus, currentSeverity)`.
- Dogfooding: This is a canonical example of lifecycle pattern implementation.

**Alternatives Considered**:
- **Validation in application service**: Rejected. Business rule enforcement must live in domain layer (DDD principle).
- **Database constraints**: Rejected. State machine logic is complex (severity-dependent). Cannot express in SQL.
- **Separate RuleLifecycleService**: Considered. Decided RuleStatus value object is sufficient—lifecycle is intrinsic to status, not a separate concept.

**Implementation Pattern**:
```typescript
// domain-shared/value-objects/rule-status.ts
export const RuleStatus = {
  canTransitionTo(from: RuleStatus, to: RuleStatus, severity: RuleSeverity): boolean {
    if (from === 'Draft' && to === 'Deprecated') return false; // blocked
    if (from === 'Active' && to === 'Deprecated' && severity === 'Mandatory') return false; // must downgrade
    return true; // all other transitions allowed
  }
}
```

---

## Decision 7: Immutable Audit Trail (RuleRevision) Strategy

**Decision**: Every rule change creates an immutable `RuleRevision` entity with snapshot of changed fields, author, timestamp. No update or delete methods on RuleRevision.

**Rationale**:
- Spec requirement FR-022: "Every rule change MUST create an immutable RuleRevision record."
- Append-only pattern ensures audit integrity. No revision can be tampered with after creation.
- Snapshot approach: Store changed fields + old/new values, not full rule copy (reduces storage).
- Author tracking: Use existing Auth module to capture user ID/role.

**Alternatives Considered**:
- **Event sourcing (store every domain event)**: Rejected for MVP. Event sourcing is overkill for audit trail. RuleRevision entity is simpler and sufficient.
- **Full snapshot (entire rule JSON per revision)**: Rejected. Wastes storage. Changed fields only is more efficient and easier to diff.
- **Soft delete with history table**: Rejected. Governance requires append-only (no delete). Revision table is the correct pattern.

**Implementation Pattern**:
```typescript
// domain-server/entities/RuleRevision.ts
export class RuleRevision extends Entity<string> {
  private constructor(props: RuleRevisionDTO) { super(props); }
  
  static create(rule: Rule, author: UserId, changedFields: string[]): RuleRevision {
    // No update() or delete() methods — immutable by design
  }
}
```

---

## Decision 8: RBAC Enforcement Strategy

**Decision**: Enforce role-based access control (RBAC) at API layer using existing Auth module guards. Domain layer validates business rules (e.g., lifecycle constraints), NOT permissions.

**Rationale**:
- Spec requirements FR-024, FR-025: Engineers can read; only Tech Leads/Architects can create/edit.
- Constitution mandates reusing existing Auth module infrastructure.
- API layer (NestJS guards or Express middleware) is the correct place for permission checks.
- Domain layer focuses on business invariants (lifecycle, uniqueness). Mixing permissions with domain logic violates separation of concerns.

**Alternatives Considered**:
- **Domain layer permission checks**: Rejected. DDD principle: domain layer is infrastructure-agnostic. Permissions are infrastructure concern.
- **Client-side only enforcement**: Rejected. Security cannot rely on UI. API must enforce.
- **Custom RBAC implementation**: Rejected. Reuse existing Auth module to avoid duplication and drift.

**Implementation Approach**:
```typescript
// apps/api/src/modules/governance/interface/governance-crud.routes.ts
router.post('/api/rules', requireRole(['TechLead', 'Architect']), createRuleHandler);
router.put('/api/rules/:id', requireRole(['TechLead', 'Architect']), updateRuleHandler);
router.get('/api/rules', authenticateUser, listRulesHandler); // all authenticated users
```

---

## Decision 9: Good/Bad Example Storage Strategy

**Decision**: Store code snippets as `CodeSnippet` value objects attached to Rule aggregate. Each snippet has: language (enum), content (string), type (GoodExample/ BadExample), optional caption.

**Rationale**:
- Spec requirement FR-011, FR-012, FR-013: At least one Good and one Bad example required.
- Value object pattern: CodeSnippet is immutable, validated on creation (non-empty content, valid language).
- Aggregate pattern: Rule aggregate root "owns" CodeSnippets (lifetime-managed, no independent existence).
- Database: Store as JSON array in Rule table (Prisma JSON field) or separate RuleCodeSnippet table (foreign key). MVP: JSON array. Post-MVP: separate table for easier querying.

**Alternatives Considered**:
- **Separate CodeSnippet entity**: Rejected for MVP. Snippets don't have independent lifecycle. They're owned by Rule.
- **Markdown with code blocks**: Rejected. Loses type safety (language validation, syntax highlighting hints). Harder to query.
- **External file storage**: Rejected. Increases complexity. Snippet content is small (<10KB each). Inline storage is simpler.

**Implementation Pattern**:
```typescript
// domain-shared/value-objects/code-snippet.ts
export class CodeSnippet extends ValueObject<CodeSnippetDTO> {
  private constructor(props: CodeSnippetDTO) { super(props); }
  
  static create(language: Language, content: string, type: SnippetType): Result<CodeSnippet> {
    if (content.trim().length === 0) return Result.fail('Content required');
    if (!LanguageEnum.includes(language)) return Result.fail('Invalid language');
    return Result.ok(new CodeSnippet({ language, content, type }));
  }
}
```

---

## Decision 10: Tag Normalization Strategy

**Decision**: Normalize tags to lowercase, trimmed, kebab-case before storage. Implement as method on RuleTag value object.

**Rationale**:
- Spec requirement FR-010: "System MUST normalize tags to lowercase, trimmed, kebab-case."
- Prevents tag fragmentation: "My Tag", "my tag", "my-tag", "MY-TAG" all become "my-tag".
- Normalization in domain layer (RuleTag.create() method) ensures consistent enforcement.
- Database: Store normalized tags. UI can display with formatting (e.g., title-case) for UX.

**Alternatives Considered**:
- **Normalization at API layer**: Rejected. Business rule belongs in domain, not infrastructure.
- **Case-insensitive database collation**: Rejected. Solves search but not duplication. Normalization is cleaner.
- **No normalization (rely on user discipline)**: Rejected. Users will create duplicate tags. Automatic normalization prevents fragmentation.

**Implementation Pattern**:
```typescript
// domain-shared/value-objects/rule-tag.ts
export class RuleTag extends ValueObject<string> {
  private constructor(value: string) { super(value); }
  
  static create(raw: string): Result<RuleTag> {
    const normalized = raw.trim().toLowerCase().replace(/\s+/g, '-');
    if (normalized.length === 0) return Result.fail('Tag cannot be empty');
    return Result.ok(new RuleTag(normalized));
  }
}
```

---

## Research Completion Summary

| Research Item | Status | Source |
|---------------|--------|--------|
| Package structure | ✅ Resolved | Architecture.md + spec clarifications |
| Database/ORM | ✅ Resolved | Architecture.md + constitution |
| State management | ✅ Resolved | Architecture.md + tech stack |
| Syntax highlighting | ✅ Resolved | Spec requirements + perf goals |
| Search relevance | ✅ Resolved | Spec clarification Q4 |
| Lifecycle state machine | ✅ Resolved | Spec clarification Q1 |
| Audit trail strategy | ✅ Resolved | Spec FR-022 + DDD patterns |
| RBAC enforcement | ✅ Resolved | Spec FR-024/FR-025 + architecture.md |
| Code snippet storage | ✅ Resolved | Spec FR-011-FR-013 + DDD |
| Tag normalization | ✅ Resolved | Spec FR-010 + domain patterns |

**Phase 0 Gate**: ✅ **PASS** — All technical unknowns resolved. Ready to proceed to Phase 1 (Design).

---

**Next Steps**: Phase 1 — Generate `data-model.md`, `contracts/`, and `quickstart.md`.
