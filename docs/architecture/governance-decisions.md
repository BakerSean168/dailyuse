# Governance Package - Architecture Decisions (ADR)

**Status**: Active  
**Created**: 2026-03-13  
**Package**: `@dailyuse/governance`  
**Last Updated**: 2026-03-13

---

## Overview

This document records architecture decision records (ADR) for the `@dailyuse/governance` package, which serves as the **DDD best-practice living document** for the entire project.

Each decision includes:

- **Problem**: What we were trying to solve
- **Options Considered**: Alternative approaches
- **Decision**: What we chose
- **Rationale**: Why this was the best choice
- **Trade-offs**: What we gave up
- **Consequences**: Long-term impact

---

## ADR-G1: Result Pattern for Error Handling

**Date**: Phase 1.3 (2026-03-13)  
**Status**: Approved  
**Affected Files**: All domain entities, use-cases, adapters  
**Test Coverage**: 121/121 tests ✅

### Problem

Entity factory methods (`create()`, `load()`) need to signal both success and failure. Two competing approaches:

1. **Throw exceptions**: Idiomatic JavaScript, but exceptions for control flow are considered anti-patterns
2. **Result type**: Functional approach, type-safe, but requires extra handling at call sites

### Options Considered

| Option                      | Pros                                          | Cons                                                       | Recommendation     |
| --------------------------- | --------------------------------------------- | ---------------------------------------------------------- | ------------------ |
| **Throw exceptions**        | Idiomatic JS; concise error handling          | Control flow via exceptions; can be missed at compile time | ❌ Not recommended |
| **Result<T> type**          | Type-safe; explicit error channel; composable | Slightly more verbose; requires discipline                 | ✅ **Chosen**      |
| **Hybrid (throw + Result)** | Flexibility                                   | Inconsistent; hard to maintain; confusing                  | ❌ Not recommended |
| **Null/undefined**          | Simple                                        | No error context; unclear if falsy is error                | ❌ Not recommended |

### Decision

**Use `Result<T>` return type for all fallible operations**, especially entity factories.

```typescript
// ✅ Preferred Pattern
static create(data: RuleCreationRequest): Result<Rule> {
  if (!data.code) {
    return error('VALIDATION_ERROR', 'Code is required');
  }
  return ok(new Rule(data));
}

// Caller handles Result
const result = Rule.create(data);
if (!isOk(result)) {
  return result; // Propagate error
}
const rule = result.data; // Safe to use
```

### Rationale

1. **Type Safety**: TypeScript forces all error cases to be handled at compile time
2. **No Runtime Overhead**: Pattern is erased at runtime; no performance cost
3. **Consistency**: All error paths visible in function signature
4. **Composability**: Results can be chained with `map()`, `flatMap()`, `withDefault()`
5. **Functional Alignment**: Aligns with Rust, fp-ts, and other FP languages

### Trade-offs

- **Verbosity**: Slightly more code than throwing (`if (!isOk(result)) return;` vs. relying on exception handling)
- **Discipline Required**: Must not mix `throw` and `Result` patterns
- **Learning Curve**: Developers unfamiliar with Result types need education

### Consequences

- ✅ All domain errors are predictable and handleable
- ✅ No surprise exceptions at runtime
- ✅ Error propagation is explicit and auditable
- ✅ Easy to add observability/logging at each Result boundary
- ⚠️ Requires consistent application across all layers
- ⚠️ Cannot use try-catch for domain errors (only for unexpected failures)

### References

- **Implemented in**: `domain-server/entities/rule-revision.ts:create()`
- **Tested in**: `domain-server/entities/__tests__/rule-revision.spec.ts`
- **Related ADR**: ADR-G2 (Error Code Standardization)
- **Industry Examples**: Rust `Result<T, E>`, fp-ts `Either<E, A>`, tRPC procedures

---

## ADR-G2: Error Code Standardization

**Date**: Phase 1.2 (2026-03-13)  
**Status**: Approved  
**Affected Files**: All repositories (Prisma, PowerSync), HTTP adapter  
**Error Codes Normalized**: 45+

### Problem

Error codes across infrastructure adapters were inconsistent:

| Source    | Codes        | Examples                                          |
| --------- | ------------ | ------------------------------------------------- |
| Prisma    | 10+ variants | `DB_ERROR`, `DATABASE_ERROR`, `QUERY_FAILED`      |
| PowerSync | 8+ variants  | `DB_ERROR`, `DELETE_FAILED`, `SYNC_ERROR`         |
| HTTP      | 6+ variants  | `CONNECTION_ERROR`, `TIMEOUT`, `INVALID_RESPONSE` |
| Domain    | 3 codes      | `VALIDATION_ERROR`, `NOT_FOUND`, `INTERNAL_ERROR` |

This created two problems:

1. **Inconsistency**: Same physical error (DB failure) reported with different codes
2. **Noise**: Too many error codes made error handling logic complex

### Options Considered

| Option                          | Pros                             | Cons                              | Recommendation        |
| ------------------------------- | -------------------------------- | --------------------------------- | --------------------- |
| **Keep all 45+ codes**          | Full error context               | Unmaintainable; inconsistent      | ❌ Not recommended    |
| **Standardize to 7 codes**      | Simple; maintainable; consistent | Loss of detailed context          | ✅ **Chosen**         |
| **Standardize + error details** | Both benefits                    | Requires structured error objects | ⏳ Future improvement |
| **Device-specific codes**       | Detailed for each source         | No unified handling               | ❌ Not recommended    |

### Decision

**Map all infrastructure-level error codes to a canonical set of 7 ResultCode values**:

```typescript
enum ResultCode {
  SUCCESS = 'SUCCESS', // Success (rarely used; ok() is preferred)
  VALIDATION_ERROR = 'VALIDATION_ERROR', // Input validation failed
  NOT_FOUND = 'NOT_FOUND', // Resource doesn't exist
  CONFLICT = 'CONFLICT', // Resource already exists / state conflict
  UNAUTHORIZED = 'UNAUTHORIZED', // Authentication failed
  FORBIDDEN = 'FORBIDDEN', // Authorization failed
  INTERNAL_ERROR = 'INTERNAL_ERROR', // Any infrastructure/unexpected error
}
```

**Error Code Mapping Table**:

| Adapter          | Old Code           | New Code         | Reason                                        |
| ---------------- | ------------------ | ---------------- | --------------------------------------------- |
| Prisma/PowerSync | `DB_ERROR`         | `INTERNAL_ERROR` | Infrastructure concern, not exposed to domain |
| Prisma/PowerSync | `DATABASE_ERROR`   | `INTERNAL_ERROR` | Same as above                                 |
| Prisma/PowerSync | `DELETE_FAILED`    | `INTERNAL_ERROR` | Result of DB failure; not distinct            |
| HTTP             | `CONNECTION_ERROR` | `INTERNAL_ERROR` | Network error; infrastructure concern         |
| HTTP             | `TIMEOUT`          | `INTERNAL_ERROR` | Adapter-level timeout; not domain concern     |

### Rationale

1. **Consistency**: Same physical error → same error code regardless of source
2. **Simplification**: 45+ codes → 7 canonical codes (-83% reduction)
3. **Clarity**: Domain errors are distinct from infrastructure errors
4. **Maintainability**: Easier to document and handle error scenarios
5. **Future-Proof**: Easy to add detailed error info without breaking code

### Trade-offs

- **Context Loss**: Lose distinction between `DB_ERROR` and `CONNECTION_ERROR` (both become `INTERNAL_ERROR`)
- **Requires Discipline**: Must resist adding new ad-hoc error codes
- **Logging Impact**: Need structured error details in log context, not just error code

### Consequences

- ✅ Controller error handling logic simplified
- ✅ Client can safely rely on 7 error codes for all scenarios
- ✅ New adapters automatically use canonical codes (no choice)
- ⚠️ Must document error context in Result.error.message
- ⚠️ Detailed error info needs to go in logs, not error code

### Detailed Error Context Strategy

For errors requiring more detail (e.g., which DB table failed), use:

```typescript
// ❌ No: Try to encode context in error code
error('DB_RULES_TABLE_ERROR', 'Failed to insert rule');

// ✅ Yes: Use standard code + structured logging
const result = error('INTERNAL_ERROR', 'Failed to insert rule');
logger.error({
  code: 'INTERNAL_ERROR',
  context: 'RulePrismaRepository.create',
  table: 'rules',
  originalError: dbError.message,
  timestamp: Date.now(),
});
return result;
```

### References

- **Implemented in**: `infrastructure-server/adapters/{prisma,powersync}/`
- **Canonical Codes**: `@dailyuse/utils/result` ResultCode enum
- **Related ADR**: ADR-G1 (Result Pattern), ADR-G3 (Error Propagation)

---

## ADR-G3: Pure Constructor Injection Over Singleton

**Date**: Phase 1.4 (2026-03-13)  
**Status**: Approved  
**Affected Files**: 6 client services (create, delete, get, list, search, update)  
**Boilerplate Removed**: 162 lines

### Problem

Client services used the singleton pattern:

```typescript
// ❌ Singleton Pattern - 40+ lines per service
export class CreateRule {
  private static _instance: CreateRule;

  private constructor(private apiClient: ApiClient) {}

  static getInstance(apiClient: ApiClient): CreateRule {
    if (!this._instance) {
      this._instance = new CreateRule(apiClient);
    }
    return this._instance;
  }

  static createInstance(apiClient: ApiClient): CreateRule {
    return new CreateRule(apiClient);
  }

  static resetInstance(): void {
    this._instance = undefined;
  }
}
```

Problems:

1. **Hidden State**: `_instance` static property hides mutable state
2. **Boilerplate**: 162 total lines across 6 services
3. **Testing Friction**: Must call `resetInstance()` in each test
4. **Confusion**: Developers unsure which method to use (`getInstance` vs. `createInstance`)

### Options Considered

| Option                         | Pros                              | Cons                                              | Recommendation                  |
| ------------------------------ | --------------------------------- | ------------------------------------------------- | ------------------------------- |
| **Singleton pattern**          | Single instance; familiar to some | Hidden state; boilerplate; testing friction       | ❌ Not recommended              |
| **Pure constructor injection** | Simple; explicit; testable        | Requires explicit DI container                    | ✅ **Chosen**                   |
| **Service Locator pattern**    | Convenience method                | Service Locator anti-pattern; hidden dependencies | ❌ Not recommended              |
| **Module with factory**        | Explicit composition              | Extra abstraction layer                           | ⏳ Consider for larger DI needs |

### Decision

**Use pure constructor injection: instantiate services explicitly with dependencies**.

```typescript
// ✅ Pure DI Pattern - 5 lines
export class CreateRule {
  constructor(private apiClient: ApiClient) {}
}

// Usage: Explicit instantiation
const apiClient = new ApiClient(config);
const createRuleService = new CreateRule(apiClient);
```

### Rationale

1. **Simplicity**: Constructor injection is JavaScript's native dependency mechanism
2. **Testability**: Pass mock ApiClient without needing `resetInstance()`
3. **Server Alignment**: Matches domain-server patterns (Entity factories use constructor injection)
4. **Explicit Dependencies**: DI graph is visible at instantiation point
5. **No Hidden State**: No static properties to maintain across test runs
6. **Boilerplate Removal**: -162 lines across 6 services (-42% per service)

### Trade-offs

- **No Convenience Singleton**: Cannot use `CreateRule.getInstance()`; must instantiate explicitly
- **Explicit Composition Required**: Larger applications need explicit factory assembly (`createGovernanceModule` pattern)
- **More Verbose at Init**: Application startup needs explicit service wiring

### Consequences

- ✅ Simpler, more readable service code
- ✅ Easier to test (just `new CreateRule(mockApiClient)`)
- ✅ No `resetInstance()` needed in tests
- ✅ Aligns with server-side DDD patterns
- ⚠️ Requires explicit composition in application layer (or use `createGovernanceModule`)
- ⚠️ Different pattern from some legacy code (migration needed over time)

### Composition Pattern

At application level, explicit wiring replaces singleton `getInstance()`:

```typescript
// ✅ Explicit wiring in application layer
export class ClientServiceContainer {
  private apiClient: ApiClient;

  constructor(config: ApiClientConfig) {
    this.apiClient = new ApiClient(config);
  }

  createRuleService(): CreateRule {
    return new CreateRule(this.apiClient);
  }

  getRuleService(): GetRule {
    return new GetRule(this.apiClient);
  }
  // ... more services
}

// Usage
const container = new ClientServiceContainer(config);
const createRuleService = container.createRuleService();
```

### References

- **Implemented in**: `application-client/services/`
- **Related to**: `infrastructure-server/governance.module.ts` (server-side pattern)
- **Related ADR**: ADR-G4 (Module Composition Pattern)

---

## ADR-G4: Dual Adapter Pattern (Prisma + PowerSync)

**Date**: Phase 1.2 (2026-03-13)  
**Status**: Approved  
**Affected Files**: `infrastructure-server/adapters/{prisma,powersync}/`

### Problem

Different architectural contexts require different persistence solutions:

1. **API Server**: Transactional database with immediate consistency (Prisma + PostgreSQL)
2. **Desktop App**: Offline-capable sync engine with local-first architecture (PowerSync + SQLite)

Both need to implement the same Repository interface, but have different capabilities and trade-offs.

### Options Considered

| Option                          | Pros                       | Cons                                        | Recommendation                  |
| ------------------------------- | -------------------------- | ------------------------------------------- | ------------------------------- |
| **Single Prisma-only**          | Simpler; unified code      | Breaks offline capability for desktop       | ❌ Not recommended              |
| **Single PowerSync-only**       | Offline-capable everywhere | Adds sync complexity to API (unnecessary)   | ❌ Not recommended              |
| **Dual adapters (Prisma + PS)** | Optimal for each context   | More code; must keep interfaces in sync     | ✅ **Chosen**                   |
| **Adapter factory pattern**     | Runtime selection          | Complex factory logic; harder to understand | ⏳ Current approach; works well |

### Decision

**Maintain two parallel repository implementations**:

- **Prisma adapter**: For API server (transactional, immediate consistency)
- **PowerSync adapter**: For desktop app (offline-capable, eventual consistency)

```typescript
// Same interface implemented twice
export interface IRuleRepository {
  findById(id: RuleId): Promise<Result<Rule>>;
  create(rule: Rule): Promise<Result<void>>;
  update(rule: Rule): Promise<Result<void>>;
  delete(id: RuleId): Promise<Result<void>>;
  // ... more methods
}

// Implementation 1: For API
export class RulePrismaRepository implements IRuleRepository {
  constructor(private prisma: PrismaClient) {}
  // ... transactional implementation
}

// Implementation 2: For Desktop
export class RulePowerSyncRepository implements IRuleRepository {
  constructor(private powerSync: PowerSyncDatabase) {}
  // ... offline-capable implementation
}
```

### Rationale

1. **Optimal Performance**: Each adapter uses native features (transactions for Prisma, sync for PowerSync)
2. **Offline-First**: Desktop can work offline without sync complexity in API
3. **API Simplicity**: Server doesn't pay overhead of sync capabilities it doesn't need
4. **Clear Semantics**: Prisma repos are transactional; PowerSync repos are eventually consistent
5. **Error Handling**: Each adapter can map its native errors to canonical ResultCode
6. **Testing**: Easier to mock one implementation than support both paths in single adapter

### Trade-offs

- **Code Duplication**: Same interface implemented twice
- **Maintenance**: Changes to interface must be implemented in both adapters
- **Discipline**: Must keep both in sync; cannot use one accidentally
- **Complexity**: Factory pattern needed to select right adapter at startup

### Consequences

- ✅ Each platform gets optimal implementation
- ✅ No unnecessary sync overhead in API
- ✅ Clear offline capability for desktop
- ⚠️ Must maintain two repository implementations
- ⚠️ Interface changes require two edits
- ⚠️ Factory pattern complexity (currently handled in `createGovernanceModule`)

### Factory Pattern for Adapter Selection

```typescript
// ✅ Factory pattern in governance composition root
function createGovernanceModule(config: GovernanceModuleConfig) {
  const ruleRepository =
    config.environment === 'api'
      ? new RulePrismaRepository(config.prisma)
      : new RulePowerSyncRepository(config.powerSync);

  return {
    api: {
      // ... callable application port
    },
  };
}

// Usage: transport consumes module.api
const module = createGovernanceModule(config);
```

### Monitoring Adapter Consistency

To prevent drift between adapters:

1. **Shared Test Suite**: `IRuleRepository` tests run against both implementations
2. **Interface Verification**: Type system ensures both implement all methods
3. **Error Code Mapping**: Both adapters must map their errors to same ResultCode values
4. **Documentation**: Each adapter should document its consistency model (immediate vs. eventual)

### References

- **Prisma Adapters**: `infrastructure-server/adapters/prisma/`
- **PowerSync Adapters**: `infrastructure-server/adapters/powersync/`
- **Factory Pattern**: `infrastructure-server/governance.module.ts`
- **Related Architecture**: `/docs/architecture/infrastructure-server.md`

---

## ADR-G5: Layered Export Structure

**Date**: Phase 2.3 (2026-03-13)  
**Status**: Approved  
**Affected Files**: 21 files across all layers annotated with @internal  
**Commit**: 80ffed6f9

### Problem

Current package exports mix internal implementation details with public API:

```typescript
// Current: What should users import?
export * from './contracts'; // ✅ Public API
export * from './domain-server'; // ❓ Internal?
export * from './application-client'; // ✅ Public API
export * from './infrastructure-client'; // ❓ Internal?
```

Developers are unclear which exports are:

- **Public API**: Stable, documented, supported version-to-version
- **Internal**: Subject to change, not part of contract
- **Adapter-Specific**: For infrastructure layer, not for application logic

### Options Considered

| Option                                    | Pros                                        | Cons                                               | Recommendation        |
| ----------------------------------------- | ------------------------------------------- | -------------------------------------------------- | --------------------- |
| **Remove internal exports from barrels**  | Smaller public API surface                  | Breaking change; consumers may depend on internals | ❌ Not recommended    |
| **@internal JSDoc annotations**           | Non-breaking; clear intent; tooling support | Still importable; relies on convention             | ✅ **Chosen**         |
| **Separate public/internal entry points** | Clean separation                            | Complex build config; hard to maintain             | ⏳ Future improvement |
| **TypeScript path restrictions**          | Compile-time enforcement                    | Requires workspace-level config changes            | ⏳ Future improvement |

### Decision

**Use `@internal` JSDoc annotations on implementation-detail exports** to clarify public vs. internal API boundaries without breaking backward compatibility.

```typescript
/**
 * @internal Infrastructure adapter — not part of public API.
 * @internal 基础设施适配器 - 非公共 API。
 */
export class RuleHttpAdapter implements IRuleApiClient { ... }
```

### Rationale

1. **Non-Breaking**: No consumer code changes required
2. **Convention-Based**: IDE tooling and documentation generators respect @internal
3. **Gradual Migration**: Can later enforce with lint rules or separate entry points
4. **Backward Compatible**: 100% — all existing imports continue to work
5. **Documentation Value**: Developers immediately see which exports are stable

### Trade-offs

- **Not Enforced**: @internal is advisory; consumers can still import internals
- **Discipline Required**: Must consistently apply @internal to new internal exports
- **No Compile-Time Check**: TypeScript doesn't prevent importing @internal members

### Consequences

- ✅ 21 files annotated across all layers
- ✅ Zero breaking changes
- ✅ Clear documentation of public vs. internal API
- ⚠️ Requires ongoing discipline to maintain annotations
- ⚠️ Future work: lint rule to warn on importing @internal exports

### References

- **Related ADR**: ADR-G3 (DI Pattern)
- **Implementation**: Phase 2.3 (80ffed6f9)
- **Documentation**: `/packages/governance/ARCHITECTURE.md`

---

## Summary Matrix

| ADR | Title                      | Status      | Impact                          | Commits   |
| --- | -------------------------- | ----------- | ------------------------------- | --------- |
| G1  | Result Pattern for Errors  | ✅ Approved | High (error handling)           | d6ba21590 |
| G2  | Error Code Standardization | ✅ Approved | High (45+ codes → 7)            | 48894fd62 |
| G3  | Pure DI Over Singleton     | ✅ Approved | Medium (boilerplate -162 lines) | 3fd0099c0 |
| G4  | Dual Adapter Pattern       | ✅ Approved | Medium (clear offline story)    | 48894fd62 |
| G5  | Export Structure Clarity   | ✅ Approved | Medium (API clarity)            | 80ffed6f9 |

---

## References

- **Governance Package**: `/packages/governance/`
- **Package README**: `/packages/governance/README.md`
- **Architecture Overview**: `/packages/governance/ARCHITECTURE.md`
- **Implementation Progress**: `/docs/architecture/optimization-progress.md`
- **Related Result Pattern**: `/docs/architecture/result-pattern.md`
- **Infrastructure Architecture**: `/docs/architecture/infrastructure-server.md`

---

**Document Status**: Active  
**Last Updated**: 2026-03-13  
**Next Review**: Before merging to main
