# Phase 0: Research & Technical Decisions

**Feature**: DailyUse Personal Productivity Web Platform  
**Created**: 2026-02-03  
**Status**: Research Complete

## 1. OKR Progress Synchronization Strategy

### Decision: **Manual-First with Optional Auto-Calculation**

**MVP Approach**: 
- User explicitly sets Key Result progress (0-100%)
- No automatic task completion aggregation
- Users manually update KR progress after completing tasks
- Provides full user control and simplicity

**Phase 2 Enhancement**:
- Optional feature: Auto-calculate KR progress from linked task completion %
- User can toggle per KR: "Auto-sync from tasks" on/off
- When enabled: KR progress = weighted average of linked task completion

### Rationale

| Aspect | Manual-Only | Auto | Why Manual First |
|--------|----------|------|-----------|
| **Complexity** | ✓ Simple | ✗ Complex | Start simple, MVP focus |
| **User Control** | ✓ Full | ✗ Less | Users understand OKR methodology |
| **Accuracy** | ✗ Requires discipline | ✓ Automatic | Quality over convenience initially |
| **Implementation** | ✓ 2-3 days | ✗ 5-7 days | Faster MVP launch |
| **Flexibility** | ✓ Any progress model | ✗ Task-based | Not all KRs are task-driven |

### Implementation Impact

- **Database**: No changes needed. KR progress is direct user input
- **API**: Add `PATCH /goals/{id}/key-results/{krId}/progress` endpoint
- **UI**: Progress bar with manual percentage selector
- **Future**: Extend with toggle + calculator logic in Phase 2

---

## 2. Notification Channels Strategy

### Decision: **Phased Implementation with 2-Channel MVP**

**MVP (Week 1-2)**:
- **In-App Toast**: Immediate notification on screen for active users
- **Browser Push**: Desktop notification when tab not focused
- Implementation: Direct dispatch (no queue needed)

**Phase 2 (Week 3-4)**:
- **Email**: Scheduled digest or immediate for critical
- **Sound**: Optional audio alert for reminders
- Implementation: Bull + Redis queue with retry logic

**Future (Post-MVP)**:
- **SMS**: High-priority alerts (opt-in)
- **Slack Integration**: Task/goal updates to connected workspace
- **Mobile App**: Native push notifications
- **Webhook**: Custom integrations

### Rationale

| Channel | Priority | MVP | Effort | Dependencies |
|---------|----------|-----|--------|--------------|
| **In-App Toast** | Critical | ✓ Yes | 2-3 hrs | Frontend only |
| **Browser Push** | High | ✓ Yes | 4-5 hrs | Service Worker |
| **Email** | Medium | ✗ Phase 2 | 8 hrs | Queue, SMTP, templates |
| **Sound** | Medium | ✗ Phase 2 | 3 hrs | Web Audio API |
| **SMS** | Low | ✗ Future | 12 hrs | SMS provider API |
| **Slack** | Low | ✗ Future | 10 hrs | Slack API |

### Notification Event Mapping

| Event | In-App | Browser Push | Email | Sound |
|-------|--------|--------------|-------|-------|
| Reminder triggered | ✓ | ✓ | - | ✓ Phase2 |
| Goal deadline (7 days) | ✓ | ✓ | ✓ Phase2 | - |
| Task due today | ✓ | ✓ | - | - |
| Collaboration mention | ✓ | ✓ | ✓ Phase2 | - |
| Weekly summary | ✓ | - | ✓ Phase2 | - |

### Architecture

```
Event Source
    ↓
Event Dispatcher (Express middleware)
    ├→ In-App Toast (immediate)
    ├→ Browser Push (immediate via WebSocket)
    └→ Queue (Bull/Redis) [Phase 2]
        ├→ Email (delayed)
        ├→ Sound (scheduled)
        └→ Future channels
```

### Implementation Impact

- **Database**: Add `user_notification_preferences`, `notification_log` tables
- **Backend**: NotificationService class with plugin architecture
- **Frontend**: Toast component + Service Worker for push
- **Queue**: Bull queues for Phase 2+ channels

---

## 3. Express Framework + RPC Protocol Optimization

### Decision: **Type-Safe RPC with DTO Separation Pattern**

**Problem Statement**: 
Current code directly uses custom domain objects in RPC map response types, violating contract separation principle. RPC map should only expose API-defined DTOs, never domain entities.

**Solution Architecture**:

```typescript
// ❌ WRONG - Direct object usage
export type ExampleRpcMap = {
  'example:create': [CreateExampleReq, ExampleDomainEntity];  // Using domain entity!
};

// ✓ CORRECT - DTO-based
export type ExampleRpcMap = {
  'example:create': [CreateExampleReq, ExampleClientDTO];  // DTO only
};
```

### Type Separation Layers

```
Domain Layer (Internal)
├→ ExampleEntity (Prisma model)
├→ ExampleAggregateRoot (Business logic)
└→ ExampleDomainModel (Domain rules)
          ↓ (Map via dedicated mapper)
API Contract Layer (External)
├→ CreateExampleReq (Request DTO)
├→ ExampleClientDTO (Response DTO)
└→ ComplexExampleDTO (Complex responses)
          ↓
RPC Protocol Layer
└→ ExampleRpcMap = { 'example:create': [Req, ResDTO] }
```

### DTO Definition Guidelines

**Request DTOs** (in `api/requests.ts`):
- Use Zod schemas for validation
- Include only user-provided fields
- No defaults or computed values

**Response DTOs** (in `api/responses.ts`):
- Include only safe-to-expose fields
- Add computed/formatted fields for API
- Never include internal IDs, hashes, or sensitive data

**Complex DTOs** (in `dtos/` folder):
- Aggregations of multiple entities
- Report/statistics DTOs
- Nested structures for complex responses

### Middleware Pattern for RPC

```typescript
// All RPC handlers follow this pattern:
RpcRequest → Validation → Business Logic → Mapper → ResponseDTO → Client

// Example
export const createExample = async (req: CreateExampleReq): Promise<ExampleClientDTO> => {
  // 1. Validation (via Zod + middleware)
  const validated = CreateExampleSchema.parse(req);
  
  // 2. Business logic (domain layer)
  const entity = await exampleService.create(validated);
  
  // 3. Mapper (critical: convert entity to DTO)
  return mapExampleEntityToClientDTO(entity);
};
```

### Implementation Roadmap

**Week 1: Foundation**
1. Create `mappers/` folder with entity→DTO mapping functions
2. Update all response types to use DTOs only
3. Add Zod validation schemas to all requests
4. Create `EntityToDTOMapper` utility class

**Week 2: Express RPC Router**
1. Implement `RpcRouter` class with type-safe handler registration
2. Add request validation middleware
3. Add response transformation middleware
4. Add error handling middleware

**Week 3: Integration**
1. Refactor all existing API handlers to use RpcRouter
2. Update RPC maps for auth, user, task modules
3. Add client-side RPC hooks (React)
4. Add RPC operation tracing/logging

**Week 4: Validation**
1. Unit tests for all mappers
2. Integration tests for RPC operations
3. Type safety verification
4. Performance optimization

### Expected Code Changes

- Add ~500 lines: Mapper utilities
- Add ~400 lines: Validation schemas (Zod)
- Refactor ~800 lines: Existing handlers
- Add ~600 lines: RPC Router implementation
- **Total**: ~2,300 lines (phased over 4 weeks)

### Benefits

✓ Type-safe at compile time  
✓ Clear separation of concerns  
✓ Testable in isolation  
✓ Contract-first design  
✓ Easy to version/deprecate  
✓ Performance optimized  

---

## 4. Technology Stack Decisions

### Backend Framework: Express.js (Confirmed)

**Why Express over NestJS**:
- Your existing codebase uses Express
- Smaller bundle size and memory footprint
- More control over architecture patterns
- Excellent middleware ecosystem
- Team expertise with Express

**Impact on decisions above**:
- RPC protocol must be Express-native (not NestJS-dependent)
- Middleware-based validation approach
- Manual dependency injection (vs decorators)

### Database: Prisma ORM

**Confirmed for all modules**:
- Existing setup in workspace
- Type-safe database access
- Good migration tooling
- Flexible schema design

### Notification Queue: Bull + Redis

**Phase 2 onwards**:
- Bull is stable and performant
- Redis already common in infrastructure
- Supports job scheduling for reminders
- Easy to extend with new job types

### Validation: Zod (TypeScript)

**For all API contracts**:
- Runtime type checking
- Clean schema syntax
- Type inference for DTOs
- Better than manual validation

---

## 5. Code Standards Summary

### RPC Map Standard

All RPC maps must follow this template:

```typescript
/**
 * {ModuleName} - RPC Map
 * 
 * 【规范说明】
 * RPC 方法映射到请求/响应 DTO 类型
 * - 请求类型: API 定义的 Request DTO (api/requests.ts)
 * - 响应类型: API 定义的 Response DTO (api/responses.ts)
 * - 禁止直接使用域模型对象
 */

import type {
  CreateXxxReq,  // From api/requests.ts
  XxxClientDTO,  // From api/responses.ts or aggregates/*-client.ts
} from '../api';

export type XxxRpcMap = {
  'xxx:create': [CreateXxxReq, XxxClientDTO];      // ✓ Correct
  'xxx:delete': [DeleteXxxReq, void];               // ✓ OK
  'xxx:batch': [BatchXxxReq, XxxClientDTO[]];       // ✓ Array OK
};
```

### No longer acceptable:

```typescript
// ❌ Wrong - Using domain entity
'example:create': [CreateExampleReq, ExampleEntity];

// ❌ Wrong - Using Prisma model
'example:list': [void, PrismaExample[]];

// ❌ Wrong - Using custom class
'example:get': [GetExampleReq, ExampleClass];
```

---

## 6. Migration Plan for Existing Code

### Current State Issues

1. **Protocol Violations** (~5 modules):
   - Auth module: Returns `AuthEntity` instead of `AuthClientDTO`
   - User module: Returns `UserEntity` instead of `UserClientDTO`
   - Similar issues in task, goal, reminder modules

2. **DTO Definitions** (Incomplete):
   - Some response types directly define inline interfaces
   - Need to consolidate in dedicated files

3. **Validation** (Missing):
   - Request validation not consistently applied
   - No schema definitions for complex queries

### Correction Priority

**Phase 1 (This feature)**:
1. Audit all existing RPC maps
2. Identify all non-DTO response types
3. Create DTO equivalents for problematic modules
4. Document correction checklist

**Phase 2 (Next iteration)**:
1. Implement RpcRouter with validation middleware
2. Migrate high-traffic modules (auth, user)
3. Add tests for mappers

**Phase 3 (Ongoing)**:
1. Complete migration of remaining modules
2. Remove direct entity exports from RPC maps
3. Establish code review checks

### Audit Checklist

For each RPC map:
- [ ] Response type is a DTO, not an entity
- [ ] DTO file location documented (api/, aggregates/, or dtos/)
- [ ] Validation schema exists for request type
- [ ] Mapper function exists to convert entity→DTO
- [ ] Tests cover mapper logic
- [ ] Code review approved

---

## Conclusion

All Phase 0 research decisions support the goal of building a clean, type-safe, Express-based productivity platform with proper separation of concerns.

**Next Phase**: Phase 1 Design (data model, API contracts, quickstart)

