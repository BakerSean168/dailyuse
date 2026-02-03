# Contracts Code Standards (Protocol/API/DTOs)

**Document Version**: 1.0.0  
**Last Updated**: 2026-02-03  
**Status**: Formal Standard (Constitution v1.1.0)

## Overview

The `packages/contracts` package enforces a strict three-layer architecture for type definitions:

```
┌─────────────────────────────────────────┐
│  Protocol Layer (RPC/Event Definitions) │  ← Defines operation contracts
│  {domain}-rpc-map.ts                    │
│  {domain}-event-map.ts                  │
└─────────────────┬───────────────────────┘
                  │ imports types from ↓
┌─────────────────────────────────────────┐
│  API Layer (Request/Response Types)     │  ← Exports validated types
│  api/index.ts                           │
│  api/crud.ts (or similar)               │
└─────────────────┬───────────────────────┘
                  │ imports from ↓
┌──────────────────────────┬──────────────┐
│ Aggregates               │ DTOs         │  ← Complex composed types
│ (domain entities)        │ (compositions)│
└──────────────────────────┴──────────────┘
```

**Key Principle**: Type definitions MUST flow downward (Protocol ← API ← Aggregates/DTOs). Never define types inline in protocol or allow upward imports.

---

## Layer 1: Protocol Layer (`protocol/`)

### Purpose
Define the RPC operation contracts and domain events that modules expose and consume.

### Structure

**File**: `{domain}-rpc-map.ts`

```typescript
/**
 * {Domain} Module - RPC Map
 * 定义模块处理的 RPC 请求和响应类型
 */

import type {
  CreateDomainReq,
  CreateDomainRes,
  UpdateDomainReq,
  UpdateDomainRes,
  // ... more types
} from '../api';

export type DomainRpcMap = {
  'domain:create': [CreateDomainReq, CreateDomainRes];
  'domain:update': [UpdateDomainReq, UpdateDomainRes];
  'domain:list': [ListDomainQuery, ListDomainRes];
  // ... more operations
};
```

**File**: `{domain}-event-map.ts`

```typescript
/**
 * {Domain} Module - Event Map
 * 定义模块发出的领域事件
 */

export interface DomainEventMap {
  'domain:DomainCreated': {
    aggregateId: string;
    timestamp: Date;
    payload: {
      name: string;
      // ... event-specific fields
    };
  };
  'domain:DomainUpdated': {
    aggregateId: string;
    timestamp: Date;
    payload: {
      // ... update fields
    };
  };
}

export type DomainDomainEvent = DomainEventMap[keyof DomainEventMap];
```

### Rules

✅ **MUST DO**:
- Import ALL request/response types from `../api`
- Use naming convention: `'domain:kebab-case-operation'`
- Use event naming: `'domain:PascalCaseEvent'`
- Include namespace prefix to ensure global uniqueness
- Export as strict type (no `export const`)
- Every type reference MUST be traceable to `../api/index.ts`

❌ **NEVER DO**:
- Define inline request/response types (e.g., `'op': [{ data: string }, { result: string }]`)
- Use custom objects without API layer export
- Mix types from multiple sources in one operation
- Export mutable objects (`export const`) instead of types
- Import from non-api sources (except aggregates for event payloads)

### Example

```typescript
// ❌ WRONG - inline custom object
export type ExampleRpcMap = {
  'example:create': [
    { name: string; description?: string },  // ← BAD: inline
    { id: string; name: string }
  ];
};

// ✅ CORRECT - imports from API
import type { CreateExampleReq, CreateExampleRes } from '../api';

export type ExampleRpcMap = {
  'example:create': [CreateExampleReq, CreateExampleRes];
};
```

---

## Layer 2: API Layer (`api/`)

### Purpose
Export all Request/Response/Query types with validation schemas. This is the **single source of truth** for all types imported by the protocol layer.

### Structure

**File**: `api/index.ts` (exports aggregator)

```typescript
/**
 * {Domain} Module - API Export
 * 按功能分组，导出所有 Req/Res/Query 类型
 */

export {
  // Create
  CreateDomainSchema,
  type CreateDomainReq,
  type CreateDomainRes,
  // Update
  UpdateDomainSchema,
  type UpdateDomainReq,
  type UpdateDomainRes,
  // List
  ListDomainQuerySchema,
  type ListDomainQuery,
  type ListDomainRes,
  // ... more exports
} from './crud';
```

**File**: `api/crud.ts` (or similar functional groupings)

```typescript
import { z } from 'zod';
import type { DomainClientDTO } from '../aggregates';
import type { ComplexDomainDTO } from '../dtos';

// ========== Create Operation ==========

export const CreateDomainSchema = z.object({
  name: z.string().min(1).max(256),
  description: z.string().max(2000).optional(),
  priority: z.number().int().min(1).max(10).optional().default(5),
  isPublic: z.boolean().optional().default(false),
});

export type CreateDomainReq = z.infer<typeof CreateDomainSchema>;
export type CreateDomainRes = DomainClientDTO;  // ← Response MUST be aggregate/entity type

// ========== Update Operation ==========

export const UpdateDomainSchema = z.object({
  name: z.string().min(1).max(256).optional(),
  description: z.string().max(2000).nullable().optional(),
  priority: z.number().int().min(1).max(10).optional(),
  isPublic: z.boolean().optional(),
});

export type UpdateDomainReq = z.infer<typeof UpdateDomainSchema>;
export type UpdateDomainRes = DomainClientDTO;

// ========== List Query ==========

export const ListDomainQuerySchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(['name', 'priority', 'createdAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type ListDomainQuery = z.infer<typeof ListDomainQuerySchema>;

export interface ListDomainRes {
  data: DomainClientDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    totalPages: number;
  };
}

// ========== Complex Query ==========

export const ComplexDomainQuerySchema = z.object({
  includeDetails: z.boolean().optional().default(false),
  filterByDescription: z.string().optional(),
});

export type ComplexDomainQuery = z.infer<typeof ComplexDomainQuerySchema>;

export interface ComplexDomainRes {
  items: ComplexDomainDTO[];
  totalCount: number;
}
```

### Rules

✅ **MUST DO**:
- Define Request types with Zod schemas for validation
- Response types MUST reference aggregates (e.g., `DomainClientDTO`)
- Query types MUST have Zod schemas
- Use naming convention: `*Req`, `*Res`, `*Query`, `*Schema`
- Export all types from `index.ts` that are used by protocol layer
- Include JSDoc comments for complex operations
- Simple types (like `void`) may be defined inline if validation not needed

❌ **NEVER DO**:
- Define response types as inline objects (MUST be entity/aggregate)
- Create types without corresponding export in `index.ts`
- Import from protocol or event maps (would create circular dependency)
- Define complex DTOs here (move to `dtos/` layer)
- Mix request and response definitions (keep them distinct)

### Example

```typescript
// ❌ WRONG - inline response, no schema
export type GetDomainReq = { id: string };
export type GetDomainRes = { id: string; name: string; createdAt: Date };

// ✅ CORRECT - schema validation, entity response
export const GetDomainSchema = z.object({
  id: z.string().uuid(),
});
export type GetDomainReq = z.infer<typeof GetDomainSchema>;
export type GetDomainRes = DomainClientDTO;  // ← from aggregates
```

---

## Layer 3: DTOs Layer (`dtos/`)

### Purpose
Define composed/complex types that combine multiple aggregates or add presentation-layer concerns. These are intermediate types not imported by protocol or API layers.

### Structure

**File**: `dtos/complex-{domain}.dto.ts`

```typescript
/**
 * Complex {Domain} DTO
 * 
 * 用途：组合多个聚合根或为特定视图场景提供定制化数据结构
 * 不应被 Protocol 或 API 层导入（避免循环依赖）
 */

import type { DomainClientDTO } from '../aggregates';
import type { RelatedEntityDTO } from '../../related/aggregates';

export interface ComplexDomainDTO {
  description?: string;
  domainDetails: DomainClientDTO;
  relatedEntities: RelatedEntityDTO[];
  otherProperties?: Record<string, any>;
}
```

### Rules

✅ **MUST DO**:
- Only import from aggregates (not from protocol or api layers)
- Compose multiple entity types when needed
- Use for presentation-layer specific concerns
- Keep in separate files (e.g., `complex-domain.dto.ts`)
- Export from optional `dtos/index.ts` if needed by consumers

❌ **NEVER DO**:
- Import from protocol layer (would create circular dependency)
- Import from API layer (would create circular dependency)
- Use DTOs in protocol or API type definitions
- Define simple types that could be in API layer (keep simple types in API)

### Example

```typescript
// ✅ CORRECT - composition of aggregates
import type { GoalClientDTO } from '../aggregates';
import type { TaskClientDTO } from '../../task/aggregates';

export interface GoalWithTasksDTO {
  goal: GoalClientDTO;
  tasks: TaskClientDTO[];
  taskCount: number;
  completedTaskCount: number;
}
```

---

## Dependency Rules (Unidirectional)

```
Protocol
   ↑
   └── imports from ──→ API
                         ↑
                         └── imports from ──→ Aggregates, DTOs
```

### Allowed Imports

| From | To | Allowed? | Example |
|------|-----|---------|---------|
| Protocol | API | ✅ YES | `import type { CreateReq } from '../api'` |
| Protocol | Aggregates | ❌ NO | Would bypass API validation |
| Protocol | DTOs | ❌ NO | Would bypass API validation |
| API | Aggregates | ✅ YES | `import type { ClientDTO } from '../aggregates'` |
| API | DTOs | ✅ YES | `import type { ComplexDTO } from '../dtos'` |
| API | Protocol | ❌ NO | Would create circular dependency |
| DTOs | Aggregates | ✅ YES | `import type { ClientDTO } from '../aggregates'` |
| DTOs | API | ❌ NO | Would create circular dependency |
| DTOs | Protocol | ❌ NO | Would create circular dependency |

---

## Real-World Example: Goal Module

### Structure
```
packages/contracts/src/modules/goal/
├── aggregates/
│   └── goal.aggregate.ts          # Entity type (GoalClientDTO)
├── api/
│   ├── index.ts                   # Exports all types
│   └── crud.ts                    # Request/Response definitions
├── dtos/
│   └── goal-with-tasks.dto.ts     # Composed type (Goal + Tasks)
└── protocol/
    ├── goal-rpc-map.ts
    ├── goal-event-map.ts
    └── index.ts
```

### api/crud.ts
```typescript
import type { GoalClientDTO } from '../aggregates';

export const CreateGoalSchema = z.object({
  title: z.string().min(1).max(256),
  description: z.string().max(2000).optional(),
});

export type CreateGoalReq = z.infer<typeof CreateGoalSchema>;
export type CreateGoalRes = GoalClientDTO;  // ← Entity from aggregates
```

### dtos/goal-with-tasks.dto.ts
```typescript
import type { GoalClientDTO } from '../aggregates';
import type { TaskClientDTO } from '../../task/aggregates';

export interface GoalWithTasksDTO {
  goal: GoalClientDTO;
  relatedTasks: TaskClientDTO[];
}
```

### protocol/goal-rpc-map.ts
```typescript
import type { CreateGoalReq, CreateGoalRes } from '../api';

export type GoalRpcMap = {
  'goal:create': [CreateGoalReq, CreateGoalRes];
  // ↑ Uses API types, never inline
};
```

---

## Build Verification

All changes MUST pass the following checks:

```bash
# Build contracts package with zero errors
pnpm nx build contracts

# Expected output:
# ✅ ESM Build success in Xms
# ✅ DTS Build success in Xms
# ✅ All .d.ts files generated
```

### Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Module '...' has no exported member 'Type'` | Type used in protocol not exported from api | Add export to `api/index.ts` |
| `Cannot find module '../api'` | API file doesn't exist | Create `api/index.ts` and `api/crud.ts` |
| `'Type' is not exported` | Type defined in api but not exported | Add to export list in `api/index.ts` |
| `Circular dependency detected` | DTO importing from protocol/api | Move DTO imports to only use aggregates |

---

## Checklist for New Module

When creating a new module or standardizing an existing one:

- [ ] Create `api/crud.ts` with request/response types using Zod schemas
- [ ] Create `api/index.ts` exporting all types from `crud.ts`
- [ ] Create `protocol/{module}-rpc-map.ts` importing from `../api`
- [ ] Create `protocol/{module}-event-map.ts` with domain events
- [ ] Create `protocol/index.ts` exporting rpc and event types
- [ ] If complex composition needed, create `dtos/{name}.dto.ts`
- [ ] Run `pnpm nx build contracts` with zero errors
- [ ] Verify all types in RPC map are traceable to `api/index.ts`
- [ ] Add JSDoc comments to complex operations

---

## Reference Implementation

**Model Module**: `packages/contracts/src/modules/example/`

Use this module as the gold standard reference for all new/updated modules.

```bash
# View structure
tree packages/contracts/src/modules/example/

# Examine pattern
cat packages/contracts/src/modules/example/api/index.ts
cat packages/contracts/src/modules/example/api/crud.ts
cat packages/contracts/src/modules/example/protocol/example-rpc-map.ts
cat packages/contracts/src/modules/example/dtos/complex-example.dto.ts
```

---

## Summary

| Layer | File | Purpose | Key Rule |
|-------|------|---------|----------|
| **Protocol** | `*-rpc-map.ts` | Define RPC operations | Types MUST be from `../api` |
| **Protocol** | `*-event-map.ts` | Define domain events | Explicit timestamp + aggregateId |
| **API** | `crud.ts` | Request/response schemas | Use Zod for validation |
| **API** | `index.ts` | Export aggregator | All types exported here are "public" |
| **DTOs** | `*.dto.ts` | Composed types | Only import from aggregates |

**Bottom Line**: No inline custom objects in protocol. All types come from API, which sources from aggregates/DTOs. Validation happens at API layer boundaries.
