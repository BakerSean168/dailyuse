# Governance Package - Architecture Overview

**Purpose**: Reference architecture for DDD best practices in `@dailyuse/governance`  
**Status**: Active (Phase 5.9 in progress)  
**Created**: 2026-03-13  
**Audience**: Package developers, architects, new team members

---

## Quick Reference

```
┌─────────────────────────────────────────────────────┐
│  Controllers (HTTP Entry Points)                     │
│  ├─ Input validation                                 │
│  ├─ Use-case orchestration                          │
│  └─ Response serialization                          │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│  Application-Server Layer (Use-Cases)              │
│  ├─ Commands: Create, Update, Delete               │
│  ├─ Queries: Get, List, Search                    │
│  └─ Orchestrate: Domain + Repositories            │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│  Domain Layer (Rich Business Models)              │
│  ├─ Aggregates: Rule, RuleRevision                │
│  ├─ Value Objects: RuleStatus, RuleSeverity      │
│  ├─ Domain Services: Cross-aggregate logic        │
│  └─ Repository Interfaces: Contracts             │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│  Infrastructure Layer (Adapters)                  │
│  ├─ Prisma Repository: For API server            │
│  ├─ PowerSync Repository: For Desktop            │
│  ├─ Mappers: Domain ↔ Persistence               │
│  └─ Composition Root: DI container              │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
         Database / Sync Engine
```

---

## Layered Architecture

### Layer 1: Contracts (Interfaces, DTOs, Events)

**Location**: `packages/governance/src/contracts/`

**Responsibility**: Define boundaries between layers (protocol-agnostic)

**Contents**:

| Module           | Purpose            | Examples                                 |
| ---------------- | ------------------ | ---------------------------------------- |
| `aggregates/`    | Aggregate DTOs     | `rule-server.ts`, `rule-client.ts`       |
| `entities/`      | Entity DTOs        | `rule-revision-server.ts`                |
| `value-objects/` | VO definitions     | `rule-status.ts`, `rule-severity.ts`     |
| `primitives/`    | IDs, branded types | `RuleId` branded string                  |
| `domain/events/` | Domain events      | `RuleCreatedEvent`, `RuleActivatedEvent` |
| `protocol/`      | RPC/Event mappings | `governance-rpc-map.ts`                  |

**Key Pattern**: Contracts are **implementation-agnostic**

```typescript
// ✅ Contracts layer - no implementation details
export interface RuleServerDTO {
  id: RuleId;
  code: string;
  title: string;
  status: RuleStatus; // Value object definition
  severity: RuleSeverity; // Value object definition
}

// ❌ NOT in contracts layer - implementation detail
export class RuleRepository {
  findById(id: RuleId): Promise<Rule> {}
}

// ❌ NOT in contracts layer - HTTP-specific
export interface CreateRuleRequest {
  code: string;
  // ... API request shape
}
```

**Public Exports**:

```typescript
// From @dailyuse/governance/contracts
export type { RuleServerDTO, RuleClientDTO, RuleRevisionServerDTO };
export type { RuleStatus, RuleSeverity, RuleTag };
export { RuleStatus, RuleSeverity, Language }; // Const objects
export { RuleCreatedEvent, RuleUpdatedEvent, RuleDeprecatedEvent };
```

---

### Layer 2: Domain-Shared (Cross-Layer Constants & Value Objects)

**Location**: `packages/governance/src/domain-shared/`

**Responsibility**: Value objects, enums, and logic usable by both server and client

**Contents**:

| Module           | Purpose             | Examples                       |
| ---------------- | ------------------- | ------------------------------ |
| `value-objects/` | VO implementations  | `RuleStatus` const object      |
| `constants/`     | Shared constants    | Status values, severity levels |
| `entities/`      | Shared entity types | Minimal entity definitions     |

**Key Pattern**: Shared, immutable, no I/O

```typescript
// ✅ Domain-shared: Pure value object
export const RuleStatus = {
  Draft: 'Draft',
  Active: 'Active',
  Deprecated: 'Deprecated',
} as const;

export type RuleStatus = (typeof RuleStatus)[keyof typeof RuleStatus];

// Usable everywhere
function canActivate(status: RuleStatus): boolean {
  return status === RuleStatus.Draft;
}
```

**Public Exports**:

```typescript
// From @dailyuse/governance/domain-shared
export { RuleStatus, RuleSeverity, Language };
export { RuleTag, CodeSnippet };
```

---

### Layer 3: Domain-Server (Rich Business Models)

**Location**: `packages/governance/src/domain-server/`

**Responsibility**: Aggregate roots, entities, value objects, domain services

**Contents**:

| Module           | Purpose                | Examples                    |
| ---------------- | ---------------------- | --------------------------- |
| `aggregates/`    | Aggregate roots        | `Rule`, `RuleSet`           |
| `entities/`      | Child entities         | `RuleRevision`              |
| `value-objects/` | Domain VOs             | `RuleCode`, `RuleName`      |
| `services/`      | Domain services        | `RuleDomainService`         |
| `repositories/`  | Repository ports       | `IRuleRepository` interface |
| `events/`        | Domain event factories | `RuleActivatedEvent`        |

**Key Pattern**: Aggregate roots with factory methods returning `Result`

```typescript
// ✅ Domain-server aggregate root
export class Rule {
  // Private constructor: force creation via factory
  private constructor(
    private _id: RuleId,
    private _code: string,
    private _status: RuleStatus,
    private _revisions: RuleRevision[],
    // ... other fields
  ) {}

  // Factory method: returns Result (errors are predictable)
  static create(request: RuleCreationRequest): Result<Rule> {
    // Validation
    if (!request.code?.trim()) {
      return error('VALIDATION_ERROR', 'Code is required');
    }

    // Construction
    const rule = new Rule(
      RuleId.new(),
      request.code,
      RuleStatus.Draft,
      [],
      // ...
    );

    return ok(rule);
  }

  // Business method: returns Result
  activate(): Result<void> {
    if (this._status !== RuleStatus.Draft) {
      return error('CONFLICT', 'Only draft rules can be activated');
    }
    this._status = RuleStatus.Active;
    this.publishEvent(RuleActivatedEvent.create(this._id));
    return ok(undefined);
  }

  // Getters (read-only)
  get id(): RuleId {
    return this._id;
  }
  get status(): RuleStatus {
    return this._status;
  }

  // Event sourcing
  getUncommittedEvents(): DomainEvent[] {
    /* ... */
  }
  clearUncommittedEvents(): void {
    /* ... */
  }
}
```

**Repository Interface** (Port):

```typescript
// ✅ Repository interface in domain layer
export interface IRuleRepository {
  findById(id: RuleId): Promise<Result<Rule>>;
  create(rule: Rule): Promise<Result<void>>;
  update(rule: Rule): Promise<Result<void>>;
  delete(id: RuleId): Promise<Result<void>>;
  findByCode(code: string): Promise<Result<Rule | null>>;
}

// Repository is implemented in infrastructure layer
// Domain layer depends on abstract interface, not concrete implementation (Dependency Inversion)
```

**Internal Exports** (Not re-exported publicly):

```typescript
// Intentionally internal - only used by application-server and infrastructure-server
export { Rule, RuleRevision };
export type { IRuleRepository };
export { RuleDomainService };
```

---

### Layer 4: Application-Server (Use-Cases, Orchestration)

**Location**: `packages/governance/src/application-server/use-cases/`

**Responsibility**: Execute business operations by orchestrating domain entities and repositories

**Contents**:

| Module      | Purpose               | Examples                                 |
| ----------- | --------------------- | ---------------------------------------- |
| `commands/` | Write operations      | `CreateRuleUseCase`, `UpdateRuleUseCase` |
| `queries/`  | Read operations       | `GetRuleUseCase`, `ListRulesUseCase`     |
| `dto/`      | Request/response DTOs | `CreateRuleRequest`, `ListRulesResponse` |

**Key Pattern**: Dependency injection, Result return, error propagation

```typescript
// ✅ Application layer use-case
export class CreateRuleUseCase {
  constructor(
    private ruleRepository: IRuleRepository,
    private ruleDomainService: RuleDomainService,
  ) {}

  async execute(request: CreateRuleRequest): Promise<Result<RuleServerDTO>> {
    // 1. Validate input
    const validationResult = this.validate(request);
    if (!validationResult.ok) return validationResult;

    // 2. Create domain entity
    const ruleResult = Rule.create({
      code: request.code,
      title: request.title,
      // ...
    });
    if (!ruleResult.ok) return ruleResult;
    const rule = ruleResult.data;

    // 3. Check business rules via domain service
    const checkResult = await this.ruleDomainService.checkUniqueness(rule.code);
    if (!checkResult.ok) return checkResult;

    // 4. Persist
    const persistResult = await this.ruleRepository.create(rule);
    if (!persistResult.ok) return persistResult;

    // 5. Notify (events)
    for (const event of rule.getUncommittedEvents()) {
      // Event publishing (for eventual consistency)
      await this.eventPublisher.publish(event);
    }
    rule.clearUncommittedEvents();

    // 6. Return DTO (not domain entity)
    return ok(RuleMapper.toPersistenceDTO(rule));
  }

  private validate(request: CreateRuleRequest): Result<void> {
    if (!request.code?.trim()) {
      return error('VALIDATION_ERROR', 'Code is required');
    }
    return ok(undefined);
  }
}
```

**Internal Exports**:

```typescript
// Intentionally internal - only used by controllers and composition root
export { CreateRuleUseCase, UpdateRuleUseCase, DeleteRuleUseCase };
export { GetRuleUseCase, ListRulesUseCase, SearchRulesUseCase };
```

---

### Layer 5: Infrastructure-Server (Adapters, Persistence)

**Location**: `packages/governance/src/infrastructure-server/`

**Responsibility**: Implement repository interfaces, compose dependencies

**Contents**:

| Module                 | Purpose                | Examples                  |
| ---------------------- | ---------------------- | ------------------------- |
| `adapters/prisma/`     | Prisma repositories    | `RulePrismaRepository`    |
| `adapters/powersync/`  | PowerSync repositories | `RulePowerSyncRepository` |
| `adapters/mappers/`    | Domain ↔ Persistence   | `RuleMapper`              |
| `di/`                  | Factory pattern        | `RuleRepositoryFactory`   |
| `governance.module.ts` | Composition root       | DI container              |

**Key Pattern**: Dual adapters with factory pattern

```typescript
// ✅ Adapter 1: Prisma (for API)
export class RulePrismaRepository implements IRuleRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: RuleId): Promise<Result<Rule>> {
    try {
      const data = await this.prisma.rules.findUnique({
        where: { id: id.value },
      });

      if (!data) {
        return error('NOT_FOUND', `Rule with id "${id.value}" not found`);
      }

      return ok(RuleMapper.toDomain(data));
    } catch (error) {
      logger.error('DB error', { error, operation: 'findById' });
      return error('INTERNAL_ERROR', 'Failed to fetch rule');
    }
  }

  async create(rule: Rule): Promise<Result<void>> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.rules.create({
          data: RuleMapper.toPersistence(rule),
        });

        // Event sourcing
        for (const event of rule.getUncommittedEvents()) {
          await tx.events.create({
            data: {
              /* ... */
            },
          });
        }
      });
      return ok(undefined);
    } catch (error) {
      logger.error('DB error', { error, operation: 'create' });
      return error('INTERNAL_ERROR', 'Failed to create rule');
    }
  }
}

// ✅ Adapter 2: PowerSync (for Desktop)
export class RulePowerSyncRepository implements IRuleRepository {
  constructor(private powerSync: PowerSyncDatabase) {}

  async findById(id: RuleId): Promise<Result<Rule>> {
    try {
      // PowerSync queries are synchronous or offline-ready
      const results = await this.powerSync.execute(sql`SELECT * FROM rules WHERE id = ?`, [
        id.value,
      ]);

      if (results.length === 0) {
        return error('NOT_FOUND', `Rule with id "${id.value}" not found`);
      }

      return ok(RuleMapper.toDomain(results[0]));
    } catch (error) {
      logger.error('PowerSync error', { error, operation: 'findById' });
      return error('INTERNAL_ERROR', 'Failed to fetch rule');
    }
  }

  async create(rule: Rule): Promise<Result<void>> {
    try {
      // PowerSync handles sync automatically; no explicit transaction
      await this.powerSync.execute(
        sql`INSERT INTO rules (id, code, status, ...) VALUES (?, ?, ?, ...)`,
        [rule.id.value, rule.code, rule.status /* ... */],
      );
      return ok(undefined);
    } catch (error) {
      logger.error('PowerSync error', { error, operation: 'create' });
      return error('INTERNAL_ERROR', 'Failed to create rule');
    }
  }
}
```

**Composition Root**:

```typescript
// ✅ Composition root: Creates dependencies based on environment
export class GovernanceModule {
  private ruleRepository: IRuleRepository;

  private constructor(
    ruleRepository: IRuleRepository,
    rulePrismaRepository: RulePrismaRepository | undefined,
    rulePowerSyncRepository: RulePowerSyncRepository | undefined,
    private domainService: RuleDomainService,
  ) {
    this.ruleRepository = ruleRepository;
  }

  static create(config: GovernanceModuleConfig): GovernanceModule {
    let ruleRepository: IRuleRepository;

    if (config.environment === 'api') {
      ruleRepository = new RulePrismaRepository(config.prisma);
    } else if (config.environment === 'desktop') {
      ruleRepository = new RulePowerSyncRepository(config.powerSync);
    } else {
      throw new Error(`Unknown environment: ${config.environment}`);
    }

    const domainService = new RuleDomainService(ruleRepository);

    return new GovernanceModule(
      ruleRepository,
      config.environment === 'api' ? (ruleRepository as any) : undefined,
      config.environment === 'desktop' ? (ruleRepository as any) : undefined,
      domainService,
    );
  }

  // Use-case factory methods
  getCreateRuleUseCase(): CreateRuleUseCase {
    return new CreateRuleUseCase(this.ruleRepository, this.domainService);
  }

  getUpdateRuleUseCase(): UpdateRuleUseCase {
    return new UpdateRuleUseCase(this.ruleRepository, this.domainService);
  }

  // ... more use-cases
}

// Usage
const module = GovernanceModule.create({
  environment: process.env.ENVIRONMENT as 'api' | 'desktop',
  prisma: prismaClient, // Only used if environment === 'api'
  powerSync: powerSyncDb, // Only used if environment === 'desktop'
});

const createRuleUseCase = module.getCreateRuleUseCase();
```

**Internal Exports**:

```typescript
// Intentionally internal - only used by application layer and composition
export { GovernanceModule };
export { RulePrismaRepository, RulePowerSyncRepository };
export { RuleMapper };
```

---

### Layer 6: Controllers (HTTP/IPC Entry Points)

**Location**: `packages/governance/src/controllers/`

**Responsibility**: Parse requests, execute use-cases, serialize responses

**Contents**:

| Module            | Purpose       | Examples               |
| ----------------- | ------------- | ---------------------- |
| `*.controller.ts` | HTTP handlers | `GovernanceController` |

**Key Pattern**: Thin controllers, business logic in use-cases

```typescript
// ✅ Thin controller
export class GovernanceController {
  constructor(
    private createRuleUseCase: CreateRuleUseCase,
    private getRuleUseCase: GetRuleUseCase,
    private updateRuleUseCase: UpdateRuleUseCase,
    private deleteRuleUseCase: DeleteRuleUseCase,
    private listRulesUseCase: ListRulesUseCase,
  ) {}

  @Post('/rules')
  async createRule(req: Request, res: Response): Promise<void> {
    // 1. Validate request body against schema
    const parseResult = CreateRuleSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json(error('VALIDATION_ERROR', parseResult.error.message));
      return;
    }

    // 2. Execute use-case (all business logic here)
    const result = await this.createRuleUseCase.execute(parseResult.data);

    // 3. Serialize based on Result status
    if (!result.ok) {
      const httpStatus = this.mapErrorToHttpStatus(result.error.code);
      res.status(httpStatus).json(result);
      return;
    }

    res.status(201).json(result);
  }

  @Get('/rules/:id')
  async getRule(req: Request, res: Response): Promise<void> {
    const result = await this.getRuleUseCase.execute({ id: req.params.id });

    if (!result.ok) {
      const httpStatus = this.mapErrorToHttpStatus(result.error.code);
      res.status(httpStatus).json(result);
      return;
    }

    res.status(200).json(result);
  }

  private mapErrorToHttpStatus(code: string): number {
    switch (code) {
      case 'VALIDATION_ERROR':
        return 400;
      case 'UNAUTHORIZED':
        return 401;
      case 'FORBIDDEN':
        return 403;
      case 'NOT_FOUND':
        return 404;
      case 'CONFLICT':
        return 409;
      case 'INTERNAL_ERROR':
        return 500;
      default:
        return 500;
    }
  }
}
```

**Public Exports**:

```typescript
// From @dailyuse/governance/api
export { GovernanceController };
```

---

### Layer 7: API Routes (Resource-First)

**Location**: `packages/governance/src/api/routes/`

**Responsibility**: Register resource-first HTTP routes with stable ordering and shared OpenAPI helpers

**Contents**:

| Module                                | Purpose                    | Examples                              |
| ------------------------------------- | -------------------------- | ------------------------------------- |
| `governance-rules.routes.ts`          | Rule resource routes       | Create / List / Search / Get / Update |
| `governance-rule-revisions.routes.ts` | Rule revision sub-resource | Get revisions                         |
| `governance-route-shared.ts`          | Shared route helpers       | Query parsing, response schemas       |
| `index.ts`                            | Resource-first aggregator  | rules + rule revisions                |

**Key Pattern**: Follow ADR-021 while preserving layer-specific boundaries

- Domain layer: aggregate / entity oriented
- Application layer: command / query oriented
- Route layer: resource / feature oriented

```typescript
// ✅ Governance route aggregator (resource-first)
export function registerGovernanceRoutes(
  handlers: GovernanceUseCases,
  middleware: PlatformMiddleware,
  openApiRegistry?: GovernanceOpenApiRegistry,
): Router {
  const controller = new GovernanceController(handlers);
  const router = Router();

  router.use(registerGovernanceRulesRoutes(controller, middleware, openApiRegistry));
  router.use(registerGovernanceRuleRevisionsRoutes(controller, middleware, openApiRegistry));

  return router;
}
```

### Layer 8: Application-Client (Client Services)

**Location**: `packages/governance/src/application-client/services/governance-client-service.ts`

**Responsibility**: Provide client-side API for consuming governance features

**Contents**:

| Module                         | Purpose               | Examples                  |
| ------------------------------ | --------------------- | ------------------------- |
| `governance-client-service.ts` | Client facade service | `GovernanceClientService` |

**Key Pattern**: Single facade + pure dependency injection + Result

```typescript
// ✅ Client facade with pure DI
export class GovernanceClientService {
  constructor(private apiClient: ApiClient) {}

  async createRule(request: CreateRuleRequest): Promise<Result<RuleClientDTO>> {
    try {
      const response = await this.apiClient.post('/rules', request);

      if (!response.ok) {
        return error(response.error.code, response.error.message);
      }

      return ok(response.data as RuleClientDTO);
    } catch (error) {
      logger.error('API error', { error, operation: 'createRule' });
      return error('INTERNAL_ERROR', 'Failed to create rule');
    }
  }
}

// Usage
const apiClient = new ApiClient({ baseUrl: 'http://localhost:3000' });
const governanceClientService = new GovernanceClientService(apiClient);

const result = await governanceClientService.createRule({
  code: 'DDD-001',
  // ...
});

if (!result.ok) {
  console.error('Failed:', result.error.message);
} else {
  console.log('Created:', result.data);
}
```

**Public Exports**:

```typescript
// From @dailyuse/governance/application-client
export { GovernanceClientService };
```

---

## Data Flow

### Write Operation (Create Rule)

```
Client                    Controller                 Use-Case                   Domain/Repository
  │                           │                          │                              │
  ├─ POST /rules ────────────→│                          │                              │
  │ { code, title, ... }      │                          │                              │
  │                           ├─ Validate ────────────→ │                              │
  │                           │                          ├─ Rule.create() ────────→ ✓ Domain validation
  │                           │                          ├─────────────────────────← Result<Rule>
  │                           │                          ├─ Check uniqueness ─────→ IRuleRepository
  │                           │                          ├─────────────────────────← Result<void>
  │                           │                          ├─ Save ────────────────→ IRuleRepository
  │                           │                          ├─────────────────────────← Result<void>
  │                           │                          ├─ Publish events ────→ EventPublisher
  │                           │                          ├─────────────────────────← Promise<void>
  │                           │                ← Result<RuleDTO>
  │                           ├─ Map to HTTP response
  │                    ← 201 Created ◄────
  │ { ok: true, data: {...} }
```

### Read Operation (Get Rule)

```
Client                    Controller                 Use-Case              Repository
  │                           │                          │                      │
  ├─ GET /rules/:id ─────────→│                          │                      │
  │                           ├─ Execute ───────────────→│                      │
  │                           │                          ├─ findById ──────────→ ✓ DB query
  │                           │                          ├──────────────────────← Result<Rule>
  │                           │                ← Result<RuleDTO>
  │                           ├─ Map to HTTP response
  │                    ← 200 OK ◄────
  │ { ok: true, data: {...} }
```

---

## Error Handling & Propagation

### Error Flow

```
Repository Layer                Use-Case Layer              Controller Layer
┌─────────────────────┐      ┌────────────────────┐      ┌──────────────────┐
│ Try DB operation    │      │ Call repository    │      │ Call use-case    │
│                     │      │                    │      │                  │
│ ┌─────────────────┐ │      │ ┌────────────────┐ │      │ ┌──────────────┐ │
│ │ IF error        │ │      │ │ IF !result.ok  │ │      │ │ IF !result   │ │
│ │ RETURN error()  │─┼─────→│ │ RETURN result  │─┼─────→│ │ Map to HTTP  │ │
│ └─────────────────┘ │      │ └────────────────┘ │      │ │ Return error │ │
│                     │      │                    │      │ └──────────────┘ │
│ ResultCode enum:    │      │ Same error type    │      │ HTTP status map: │
│ - NOT_FOUND         │      │ propagates up      │      │ - 404            │
│ - VALIDATION_ERROR  │      │                    │      │ - 400            │
│ - INTERNAL_ERROR    │      │                    │      │ - 500            │
└─────────────────────┘      └────────────────────┘      └──────────────────┘
```

### ResultCode Enum (Canonical)

```typescript
export enum ResultCode {
  SUCCESS = 'SUCCESS', // 200 OK
  VALIDATION_ERROR = 'VALIDATION_ERROR', // 400 Bad Request
  UNAUTHORIZED = 'UNAUTHORIZED', // 401 Unauthorized
  FORBIDDEN = 'FORBIDDEN', // 403 Forbidden
  NOT_FOUND = 'NOT_FOUND', // 404 Not Found
  CONFLICT = 'CONFLICT', // 409 Conflict
  INTERNAL_ERROR = 'INTERNAL_ERROR', // 500 Internal Server Error
}
```

**All adapters (Prisma, PowerSync, HTTP) map their native errors to these canonical codes.**

---

## Dual Persistence Pattern (Prisma + PowerSync)

### Why Both?

| Context         | Needs                                       | Solution            |
| --------------- | ------------------------------------------- | ------------------- |
| **API Server**  | Transactional consistency, immediate writes | Prisma + PostgreSQL |
| **Desktop App** | Offline capability, eventual consistency    | PowerSync + SQLite  |

### Architecture Decision

- **Single interface**: `IRuleRepository`
- **Two implementations**: `RulePrismaRepository` (API), `RulePowerSyncRepository` (Desktop)
- **Factory pattern**: Choose implementation at startup based on environment
- **Error mapping**: Both map their errors to canonical `ResultCode`

### When to Use Each

| Scenario                         | Repository       | Why                                 |
| -------------------------------- | ---------------- | ----------------------------------- |
| API server resolving request     | Prisma           | Immediate consistency; transactions |
| Desktop app working offline      | PowerSync        | Can work without network            |
| Desktop app syncing              | PowerSync        | Handles sync automatically          |
| Desktop app querying local cache | PowerSync        | Real-time local queries             |
| Bulk operations                  | Prisma           | Transactions; atomicity             |
| Mobile/web client                | Prisma (via API) | Uses HTTP client services           |

### Key Differences

| Aspect              | Prisma            | PowerSync                  |
| ------------------- | ----------------- | -------------------------- |
| Consistency         | Immediate         | Eventual                   |
| Transactions        | ✅ Full ACID      | ⚠️ Per-operation           |
| Network Requirement | Required          | Optional (offline-capable) |
| Query Language      | SQL (via Prisma)  | SQL (via PowerSync)        |
| Sync                | Manual via events | Automatic bi-directional   |
| Best For            | API server        | Desktop app                |

---

## Export Structure (Public API)

### What's Public (Stable)

```typescript
// ✅ Stable public API
export * from '@dailyuse/governance/contracts';
export * from '@dailyuse/governance/domain-shared';
export * from '@dailyuse/governance/application-client';
export * from '@dailyuse/governance/infrastructure-client';

// Includes:
// - Types: RuleServerDTO, RuleClientDTO, RuleStatus, etc.
// - Constants: RuleSeverity values, Languages
// - Client Service: GovernanceClientService
```

### What's Internal (Can Change)

```typescript
// ❌ Internal implementation - subject to change
export * from '@dailyuse/governance/domain-server'; // Domain entities (aggregate roots, entities, value objects)
export * from '@dailyuse/governance/application-server'; // Use-cases (internal orchestration logic)
export * from '@dailyuse/governance/infrastructure-server'; // Adapters, repositories, mappers
```

### Why Separate?

- **Contracts + Client**: What external code should depend on
- **Domain + Application + Infrastructure**: Internal implementation; can be refactored without breaking consumers

---

## Testing Strategy

### Unit Tests: Domain

```typescript
// Test domain entities in isolation
describe('Rule.create()', () => {
  it('creates a rule with valid input', () => {
    const result = Rule.create({ code: 'DDD-001' /* ... */ });
    expect(result.ok).toBe(true);
  });

  it('returns validation error if code is missing', () => {
    const result = Rule.create({ code: '' /* ... */ });
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('VALIDATION_ERROR');
  });
});
```

### Integration Tests: Use-Cases

```typescript
// Test use-case with real/mock repository
describe('CreateRuleUseCase', () => {
  let useCase: CreateRuleUseCase;
  let repository: IRuleRepository;

  beforeEach(() => {
    repository = new InMemoryRuleRepository();
    useCase = new CreateRuleUseCase(repository);
  });

  it('creates and persists a rule', async () => {
    const result = await useCase.execute({ code: 'DDD-002' /* ... */ });
    expect(result.ok).toBe(true);

    // Verify persistence
    const persisted = await repository.findById(result.data.id);
    expect(persisted.ok).toBe(true);
  });
});
```

### E2E Tests: Controllers

```typescript
// Test full HTTP request/response cycle
describe('POST /rules', () => {
  it('creates a rule via HTTP', async () => {
    const response = await request(app).post('/rules').send({ code: 'DDD-003' /* ... */ });

    expect(response.status).toBe(201);
    expect(response.body.ok).toBe(true);
    expect(response.body.data.code).toBe('DDD-003');
  });
});
```

---

## Key Design Decisions

### 1. Result<T> for Errors (ADR-G1)

**Why**: Type-safe error handling with compile-time guarantees

```typescript
// ✅ Errors are explicit in type signature
async execute(): Promise<Result<RuleDTO>> {
  // TypeScript forces you to check result.ok before accessing data
}

// ❌ Alternative: Throw exceptions
async execute(): Promise<RuleDTO> {
  // Error can be missed at compile time
}
```

### 2. Pure DI (ADR-G3)

**Why**: Explicit dependencies, easier testing, aligned with server patterns

```typescript
// ✅ Dependencies explicit
constructor(private repository: IRuleRepository) {}

// ❌ Alternative: Singleton
static getInstance(repository: IRuleRepository): this {
  // Hidden state; must call resetInstance() in tests
}
```

### 3. Dual Adapters (ADR-G4)

**Why**: Optimal implementation for each platform (API vs. Desktop)

```typescript
// ✅ Two implementations, one interface
IRuleRepository
├─ RulePrismaRepository (API, transactional)
└─ RulePowerSyncRepository (Desktop, eventual consistency)

// ❌ Alternative: Single implementation
// Either API has sync overhead, or Desktop lacks offline capability
```

### 4. Canonical Error Codes (ADR-G2)

**Why**: Consistent error handling, reduced code complexity

```typescript
// ✅ 7 canonical codes
error('NOT_FOUND', 'Rule not found');
error('CONFLICT', 'Rule already exists');
error('INTERNAL_ERROR', 'Database failure');

// ❌ Alternative: Too many codes
error('DB_ERROR', '...');
error('RULE_NOT_FOUND', '...');
error('RULE_DUPLICATE', '...');
// Hard to maintain; inconsistent handling
```

---

## Extension Points

### Adding a New Entity

1. **Define contracts**: `contracts/{entity}-{server,client}.ts`
2. **Create domain model**: `domain-server/aggregates/{entity}.ts`
3. **Define repository**: `domain-server/repositories/i-{entity}-repository.ts`
4. **Implement adapters**:
   - `infrastructure-server/adapters/prisma/{entity}-prisma.repository.ts`
   - `infrastructure-server/adapters/powersync/{entity}-powersync.repository.ts`
5. **Create use-cases**: `application-server/use-cases/{commands,queries}`
6. **Implement controller**: `controllers/{entity}.controller.ts`
7. **Create client services**: `application-client/services/{entity}-*.ts`

### Adding a New Use-Case

1. Create new file in `application-server/use-cases/{commands,queries}`
2. Inject dependencies (repository, domain service)
3. Implement orchestration logic
4. Return `Result<DTO>`
5. Add to controller
6. Add to module factory method

### Adding a New Repository Implementation

1. Implement `IRuleRepository` interface
2. Map errors to canonical `ResultCode` values
3. Add to `infrastructure-server/adapters/` directory
4. Update factory pattern in `GovernanceModule`

---

## Common Pitfalls

### ❌ Mistake 1: Business Logic in Controller

```typescript
// DON'T DO THIS
@Post('/rules')
async create(req: Request) {
  const rule = new Rule(req.body);
  if (await this.prisma.rules.findUnique({ where: { code: rule.code } })) {
    throw new Error('Rule exists');
  }
  return this.prisma.rules.create({ data: rule });
}

// DO THIS INSTEAD
@Post('/rules')
async create(req: Request) {
  return this.createRuleUseCase.execute(req.body);
}
```

### ❌ Mistake 2: Throwing Instead of Returning Result

```typescript
// DON'T DO THIS
if (!user) {
  throw new NotFoundException('User not found');
}

// DO THIS INSTEAD
if (!user) {
  return error('NOT_FOUND', 'User not found');
}
```

### ❌ Mistake 3: Returning Domain Entities

```typescript
// DON'T DO THIS
return ok(rule); // rule is domain entity with private properties

// DO THIS INSTEAD
return ok(RuleMapper.toPersistenceDTO(rule)); // rule is DTO with public properties
```

### ❌ Mistake 4: Mixed Error Codes

```typescript
// DON'T DO THIS
error('RULE_CREATE_FAILED', '...');
error('RULE_UPDATE_FAILED', '...');
error('RULE_DELETE_FAILED', '...');

// DO THIS INSTEAD
error('INTERNAL_ERROR', 'Failed to create rule');
error('INTERNAL_ERROR', 'Failed to update rule');
error('INTERNAL_ERROR', 'Failed to delete rule');
```

---

## Quick Navigation

| Need                 | Location                                       |
| -------------------- | ---------------------------------------------- |
| Type definitions     | `contracts/`                                   |
| Constants & enums    | `domain-shared/`                               |
| Business logic       | `domain-server/`                               |
| Orchestration        | `application-server/use-cases/`                |
| Database logic       | `infrastructure-server/adapters/`              |
| HTTP entry point     | `controllers/`                                 |
| API client           | `application-client/services/`                 |
| Errors & patterns    | `/docs/architecture/governance-decisions.md`   |
| Implementation guide | `/packages/governance/IMPLEMENTATION_GUIDE.md` |

---

## References

- **Optimization Progress**: `/docs/architecture/optimization-progress.md`
- **Architecture Decisions**: `/docs/architecture/governance-decisions.md`
- **Implementation Guide**: `/packages/governance/IMPLEMENTATION_GUIDE.md`
- **Result Pattern**: `/docs/architecture/result-pattern.md`
- **Infrastructure Architecture**: `/docs/architecture/infrastructure-server.md`
- **Package README**: `/packages/governance/README.md`

---

**Status**: Active (Phase 5.9 in progress)  
**Last Updated**: 2026-03-14  
**Audience**: Package developers, architects, onboarding engineers
