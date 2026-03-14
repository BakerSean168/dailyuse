# Governance Package - Implementation Guide

**Purpose**: How to use `@dailyuse/governance` as a reference for DDD best practices  
**Target Audience**: Package developers building new features  
**Status**: Active  
**Last Updated**: 2026-03-14

---

## Quick Start

### For API Development

```typescript
import type { RuleClientDTO } from '@dailyuse/governance/contracts';
import { GovernanceClientService } from '@dailyuse/governance/application-client';

// 1. Create an API client
const apiClient = new ApiClient({ baseUrl: 'http://localhost:3000' });

// 2. Instantiate service facade
const governanceClientService = new GovernanceClientService(apiClient);

// 3. Use the facade
const result = await governanceClientService.createRule({
  code: 'DDD-001',
  title: 'Use aggregate roots for complex entities',
  description: 'Aggregate roots...',
  severity: 'Mandatory',
  tags: ['ddd', 'entities'],
  goodExamples: [
    /* ... */
  ],
  badExamples: [
    /* ... */
  ],
  authorId: 'user-123',
});

// 4. Handle Result type
if (!result.ok) {
  console.error('Failed:', result.error.message);
} else {
  console.log('Created:', result.data);
}
```

### For Desktop Development

```typescript
import { GovernanceModule } from '@dailyuse/governance/infrastructure-server';

// 1. Initialize module with PowerSync
const module = GovernanceModule.create({
  environment: 'desktop',
  powerSync: powerSyncDatabase,
  // ... other config
});

// 2. Get use-cases (works identically to API)
const createRuleUseCase = module.getCreateRuleUseCase();
const updateRuleUseCase = module.getUpdateRuleUseCase();

// 3. Execute use-cases (same Result pattern)
const result = await createRuleUseCase.execute({
  code: 'DDD-002',
  // ... rest of data
  authorId: 'user-456',
});

if (!result.ok) {
  // Same error handling as API
  logger.error(result.error.code, result.error.message);
} else {
  // Same success handling as API
  ui.showSuccess(`Rule ${result.data.id} created`);
}
```

---

## Architecture Patterns to Copy

### 1. Contracts Layer - Type Definitions & DTOs

**Location**: `packages/governance/src/contracts/`

**Pattern**: Separate contracts from implementation

```typescript
// ✅ Good: Contracts are implementation-agnostic
// contracts/aggregates/rule-server.ts
export interface RuleServerDTO {
  id: RuleId;
  code: string;
  title: string;
  status: RuleStatus;
  severity: RuleSeverity;
  tags: RuleTag[];
  createdAt: Date;
  updatedAt: Date;
}

// contracts/aggregates/rule-client.ts
export interface RuleClientDTO {
  id: RuleId;
  code: string;
  title: string;
  // Fewer fields for client consumption
}

// ❌ Bad: Mix contracts with implementation
// (Avoid putting repository queries in contracts)
```

**When to Use**:

- ✅ Type definitions that cross layer boundaries
- ✅ API DTOs (request/response shapes)
- ✅ Domain events
- ✅ Value object definitions
- ❌ Use-case implementation details
- ❌ Repository implementation specifics

**File Organization**:

```
contracts/
├── aggregates/           # Aggregate DTOs
├── value-objects/        # VO definitions
├── entities/             # Entity DTOs
├── domain/events/        # Domain event types
├── primitives/           # IDs, branded types
└── dtos/                 # Deprecated examples (will be cleaned up)
```

### 2. Domain Layer - Rich Models with Business Logic

**Location**: `packages/governance/src/domain-server/`

**Pattern**: Aggregate roots contain business logic, not just data

```typescript
// ✅ Good: Rich domain model
export class Rule {
  private constructor(
    private _id: RuleId,
    private _code: string,
    private _status: RuleStatus,
    // ... other fields
  ) {}

  // Factory method returns Result
  static create(request: RuleCreationRequest): Result<Rule> {
    if (!request.code) {
      return error('VALIDATION_ERROR', 'Code is required');
    }
    return ok(new Rule(RuleId.new(), request.code, RuleStatus.Draft /* ... */));
  }

  // Business methods encapsulate rules
  activate(): Result<void> {
    if (this._status !== RuleStatus.Draft) {
      return error('CONFLICT', 'Only draft rules can be activated');
    }
    this._status = RuleStatus.Active;
    this.publish(RuleActivatedEvent.create(this._id));
    return ok(undefined);
  }

  // Event publishing (for persistence notification)
  private publish(event: DomainEvent): void {
    this._uncommittedEvents.push(event);
  }

  getUncommittedEvents(): DomainEvent[] {
    return this._uncommittedEvents;
  }
  clearUncommittedEvents(): void {
    this._uncommittedEvents = [];
  }
}

// ❌ Bad: Anemic data model
export class Rule {
  id: RuleId;
  code: string;
  status: string;
  // Just getters/setters, no business logic
}
```

**When to Use**:

- ✅ Core business entities (aggregates, entities, value objects)
- ✅ Domain services (when multiple entities need coordination)
- ✅ Repository interfaces (contracts that domain needs)
- ❌ Infrastructure concerns (database queries)
- ❌ Use-case orchestration

**Key Patterns**:

1. **Private Constructor**: Force creation through factory methods (`create()`, `load()`)
2. **Factory Returns Result**: Failure cases are explicit
3. **Business Methods Return Result**: Errors are predictable
4. **Immutable Fields**: Use `private readonly` to prevent unexpected mutations
5. **Event Publishing**: Track state changes for notification

### 3. Application Layer - Use Cases

**Location**: `packages/governance/src/application-server/use-cases/`

**Pattern**: Use-cases orchestrate domain entities and repositories

```typescript
// ✅ Good: Use-case with proper error handling
export class CreateRuleUseCase {
  constructor(
    private ruleRepository: IRuleRepository,
    private domainService: RuleDomainService,
  ) {}

  async execute(request: CreateRuleRequest): Promise<Result<RuleServerDTO>> {
    // 1. Validate input
    const validationResult = this.validateInput(request);
    if (!validationResult.ok) {
      return validationResult;
    }

    // 2. Create domain entity (may fail)
    const entityResult = Rule.create({
      code: request.code,
      title: request.title,
      severity: request.severity,
      // ... other fields
    });
    if (!entityResult.ok) {
      return entityResult; // Propagate validation error
    }

    // 3. Check business rules (repository lookups)
    const existingRule = await this.ruleRepository.findByCode(request.code);
    if (existingRule.ok) {
      return error('CONFLICT', `Rule with code "${request.code}" already exists`);
    }

    // 4. Persist (may fail)
    const saveResult = await this.ruleRepository.create(entityResult.data);
    if (!saveResult.ok) {
      return saveResult; // Propagate persistence error
    }

    // 5. Return DTO (not internal domain entity)
    return ok(RuleMapper.toPersistenceDTO(entityResult.data));
  }

  private validateInput(request: CreateRuleRequest): Result<void> {
    if (!request.code?.trim()) {
      return error('VALIDATION_ERROR', 'Code is required and must not be empty');
    }
    if (request.code.length > 100) {
      return error('VALIDATION_ERROR', 'Code must be less than 100 characters');
    }
    // ... more validation
    return ok(undefined);
  }
}

// ❌ Bad: Use-case mixing concerns
export class CreateRuleUseCase {
  async execute(request: CreateRuleRequest): Promise<RuleServerDTO> {
    // Doesn't return Result (can't handle errors)
    // Mixes validation, business logic, persistence
    const rule = new Rule(request);
    await this.prisma.rules.create({ data: rule });
    return rule;
  }
}
```

**Key Patterns**:

1. **Pure Constructor Injection**: Dependencies passed to constructor
2. **Result Return Type**: All operations are fallible
3. **Early Returns**: Exit on first error (guard clauses)
4. **Single Responsibility**: Each use-case does one business operation
5. **DTO Mapping**: Return DTOs, not domain entities

**File Organization**:

```
application-server/
├── use-cases/
│   ├── commands/        # Write operations (Create, Update, Delete)
│   │   ├── create-rule.use-case.ts
│   │   ├── update-rule.use-case.ts
│   │   ├── delete-rule.use-case.ts
│   │   └── __tests__/
│   └── queries/         # Read operations
│       ├── get-rule.use-case.ts
│       ├── list-rules.use-case.ts
│       └── __tests__/
└── dto/                 # Request/response DTOs for use-cases
```

### 4. Infrastructure Layer - Repositories

**Location**: `packages/governance/src/infrastructure-server/adapters/`

**Pattern**: Implement repository interfaces, map errors to Result codes

```typescript
// ✅ Good: Adapter implements interface, handles errors
export class RulePrismaRepository implements IRuleRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: RuleId): Promise<Result<Rule>> {
    try {
      const data = await this.prisma.rules.findUnique({
        where: { id: id.value },
        include: { revisions: true },
      });

      if (!data) {
        return error('NOT_FOUND', `Rule with id "${id.value}" not found`);
      }

      return ok(RuleMapper.toDomain(data));
    } catch (error) {
      logger.error('Repository error:', { operation: 'findById', error });
      return error('INTERNAL_ERROR', 'Failed to fetch rule');
    }
  }

  async create(rule: Rule): Promise<Result<void>> {
    try {
      const events = rule.getUncommittedEvents();

      await this.prisma.$transaction(async (tx) => {
        await tx.rules.create({
          data: RuleMapper.toPersistence(rule),
        });

        // Store events for eventual consistency
        for (const event of events) {
          await tx.domainEvents.create({
            data: DomainEventMapper.toPersistence(event),
          });
        }
      });

      rule.clearUncommittedEvents();
      return ok(undefined);
    } catch (error) {
      logger.error('Repository error:', { operation: 'create', error });
      return error('INTERNAL_ERROR', 'Failed to create rule');
    }
  }

  async delete(id: RuleId): Promise<Result<void>> {
    try {
      await this.prisma.rules.delete({
        where: { id: id.value },
      });
      return ok(undefined);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        return error('NOT_FOUND', `Rule with id "${id.value}" not found`);
      }
      logger.error('Repository error:', { operation: 'delete', error });
      return error('INTERNAL_ERROR', 'Failed to delete rule');
    }
  }
}

// ❌ Bad: Adapter doesn't handle errors
export class RulePrismaRepository implements IRuleRepository {
  async findById(id: RuleId): Promise<Rule> {
    const data = await this.prisma.rules.findUnique({
      where: { id: id.value },
    });
    return RuleMapper.toDomain(data); // Crashes if not found
  }
}
```

**Key Patterns**:

1. **Implements Interface**: Repository port defined in domain layer
2. **Result Return**: All operations return Result
3. **Error Mapping**: DB-specific errors → canonical ResultCode
4. **Transactional Groups**: Use DB transactions for consistency
5. **Event Sourcing**: Track events for notifications
6. **Logging**: Structured logging for debugging

### 5. Controllers - Entry Points

**Location**: `packages/governance/src/controllers/`

**Pattern**: Validate input, orchestrate use-cases, serialize responses

```typescript
// ✅ Good: Controller handles HTTP layer
export class GovernanceController {
  constructor(
    private createRuleUseCase: CreateRuleUseCase,
    private getRuleUseCase: GetRuleUseCase,
    private updateRuleUseCase: UpdateRuleUseCase,
    private deleteRuleUseCase: DeleteRuleUseCase,
  ) {}

  @Post('/rules')
  async createRule(req: Request): Promise<Response> {
    // 1. Parse and validate request body
    const parseResult = CreateRuleSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(error('VALIDATION_ERROR', parseResult.error.message));
    }

    // 2. Execute use-case (returns Result)
    const result = await this.createRuleUseCase.execute(parseResult.data);

    // 3. Serialize based on Result status
    if (!result.ok) {
      const status = this.mapErrorToStatus(result.error.code);
      return res.status(status).json(result);
    }

    return res.status(201).json(result);
  }

  @Get('/rules/:id')
  async getRule(req: Request): Promise<Response> {
    const result = await this.getRuleUseCase.execute({ id: req.params.id });

    if (!result.ok) {
      const status = this.mapErrorToStatus(result.error.code);
      return res.status(status).json(result);
    }

    return res.status(200).json(result);
  }

  private mapErrorToStatus(code: string): number {
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
      default:
        return 500;
    }
  }
}

// ❌ Bad: Controller with business logic
export class GovernanceController {
  @Post('/rules')
  async createRule(req: Request): Promise<Response> {
    const rule = new Rule(req.body); // Business logic in controller!
    if (await this.ruleExists(rule.code)) {
      throw new Error('Rule exists'); // Exceptions for control flow
    }
    await this.prisma.rules.create({ data: rule }); // Direct DB access
    return res.json(rule); // Returns domain entity, not DTO
  }
}
```

**Key Patterns**:

1. **Input Validation**: Use Zod/schema validation
2. **Use-Case Orchestration**: Delegate business logic to use-cases
3. **Result Mapping**: Convert Result to HTTP response
4. **Error Code to Status**: Map ResultCode to HTTP status codes
5. **No Business Logic**: Controllers are thin orchestrators

---

## Patterns by Feature Type

### Creating a New Entity (Like Rule)

**Follow this checklist**:

1. **Create Contracts**

   ```
   contracts/aggregates/your-entity-{client,server}.ts
   contracts/entities/your-entity.ts
   contracts/value-objects/your-status.ts (if has state machine)
   contracts/domain/events/your-entity-*.event.ts
   contracts/primitives/ids.ts (add YourEntityId)
   ```

2. **Create Domain Model**

   ```
   domain-server/aggregates/your-entity.ts
   domain-server/repositories/i-your-entity-repository.ts
   domain-server/services/your-entity.domain-service.ts (if complex logic)
   ```

3. **Create Use-Cases**

   ```
   application-server/use-cases/commands/create-your-entity.use-case.ts
   application-server/use-cases/commands/update-your-entity.use-case.ts
   application-server/use-cases/commands/delete-your-entity.use-case.ts
   application-server/use-cases/queries/get-your-entity.use-case.ts
   application-server/use-cases/queries/list-your-entities.use-case.ts
   ```

4. **Create Repositories**

   ```
   infrastructure-server/adapters/prisma/your-entity-prisma.repository.ts
   infrastructure-server/adapters/powersync/your-entity-powersync.repository.ts
   infrastructure-server/adapters/mappers/your-entity.mapper.ts
   ```

5. **Create Client Services**

   ```
   application-client/services/governance-client-service.ts
   ```

6. **Create Controller & Routes**
   ```
   controllers/your-entity.controller.ts
   api/routes/your-module-feature.routes.ts
   ```

---

## Testing Patterns

### Unit Test: Domain Entity

```typescript
describe('Rule.create()', () => {
  it('should create a rule with valid input', () => {
    const request = {
      code: 'DDD-001',
      title: 'Test Rule',
      severity: RuleSeverity.Mandatory,
      // ... required fields
    };

    const result = Rule.create(request);

    expect(result.ok).toBe(true);
    expect(result.data.code).toBe('DDD-001');
  });

  it('should return VALIDATION_ERROR if code is missing', () => {
    const request = {
      code: '',
      title: 'Test Rule',
      // ... other fields
    };

    const result = Rule.create(request);

    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('VALIDATION_ERROR');
    expect(result.error?.message).toContain('Code is required');
  });
});
```

### Integration Test: Use-Case

```typescript
describe('CreateRuleUseCase', () => {
  let useCase: CreateRuleUseCase;
  let repository: IRuleRepository;

  beforeEach(() => {
    // Use in-memory repository for testing
    repository = new InMemoryRuleRepository();
    useCase = new CreateRuleUseCase(repository);
  });

  it('should create a rule and persist it', async () => {
    const result = await useCase.execute({
      code: 'DDD-002',
      title: 'Test Rule',
      // ... other fields
    });

    expect(result.ok).toBe(true);

    // Verify it was persisted
    const persisted = await repository.findById(result.data.id);
    expect(persisted.ok).toBe(true);
    expect(persisted.data.code).toBe('DDD-002');
  });

  it('should return CONFLICT if rule with same code exists', async () => {
    // Create first rule
    await useCase.execute({ code: 'DDD-003', ... });

    // Try to create duplicate
    const result = await useCase.execute({ code: 'DDD-003', ... });

    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('CONFLICT');
  });
});
```

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Mixing Concerns

```typescript
// ❌ Bad: Business logic in controller
export class GovernanceController {
  @Post('/rules')
  async createRule(req: Request) {
    const rule = new Rule(req.body);

    // Business logic should be in use-case, not controller!
    if (await this.prisma.rules.findUnique({ where: { code: rule.code } })) {
      throw new Error('Rule exists');
    }

    return this.prisma.rules.create({ data: rule });
  }
}

// ✅ Good: Thin controller, business logic in use-case
export class GovernanceController {
  @Post('/rules')
  async createRule(req: Request) {
    const result = await this.createRuleUseCase.execute(req.body);
    return res.status(result.ok ? 201 : 400).json(result);
  }
}
```

### ❌ Mistake 2: Throwing Exceptions for Business Errors

```typescript
// ❌ Bad: Exception for business error
if (!user) {
  throw new NotFoundException('User not found');
}

// ✅ Good: Return Result for business error
if (!user) {
  return error('NOT_FOUND', 'User not found');
}
```

### ❌ Mistake 3: Exposing Domain Entities

```typescript
// ❌ Bad: Return domain entity directly
export class GetRuleUseCase {
  async execute(id: RuleId): Promise<Rule> {
    return this.repository.findById(id);
  }
}

// ✅ Good: Return DTO
export class GetRuleUseCase {
  async execute(id: RuleId): Promise<Result<RuleServerDTO>> {
    const result = await this.repository.findById(id);
    if (!result.ok) return result;
    return ok(RuleMapper.toPersistenceDTO(result.data));
  }
}
```

### ❌ Mistake 4: Adding New Error Codes

```typescript
// ❌ Bad: Custom error code per scenario
return error('RULE_DUPLICATE', 'Rule with same code exists');
return error('RULE_INACTIVE', 'Rule is not active');
return error('RULE_LOCKED', 'Rule is locked for editing');

// ✅ Good: Use canonical error codes
return error('CONFLICT', 'Rule with same code exists');
return error('CONFLICT', 'Rule is not active');
return error('CONFLICT', 'Rule is locked for editing');
```

### ❌ Mistake 5: Direct Database Access from Controllers

```typescript
// ❌ Bad: Controller accesses DB directly
export class GovernanceController {
  @Get('/rules')
  async listRules(req: Request) {
    return this.prisma.rules.findMany();
  }
}

// ✅ Good: Use use-case layer
export class GovernanceController {
  @Get('/rules')
  async listRules(req: Request) {
    const result = await this.listRulesUseCase.execute({});
    return res.json(result);
  }
}
```

---

## Next Steps

1. **Review the governance package source code** at `/packages/governance/src/`
2. **Read the architecture documentation** at `/packages/governance/ARCHITECTURE.md` (being created in Phase 2.1)
3. **Check the ADRs** at `/docs/architecture/governance-decisions.md` for rationale
4. **Copy patterns to your new package** following this guide
5. **Run tests frequently** to catch issues early
6. **Ask questions**: If a pattern is unclear, refer to the governance package example

---

## References

- **Governance Package**: `/packages/governance/`
- **Architecture Decisions**: `/docs/architecture/governance-decisions.md`
- **Optimization Progress**: `/docs/architecture/optimization-progress.md`
- **Package README**: `/packages/governance/README.md`
- **Result Pattern**: `/docs/architecture/result-pattern.md`
- **Infrastructure Architecture**: `/docs/architecture/infrastructure-server.md`

---

**Status**: Active  
**Last Updated**: 2026-03-13  
**Feedback**: Submit issues to https://github.com/anomalyco/opencode
