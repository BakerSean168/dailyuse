# RPC Architecture Decision Guide

## Decision Trees

### Decision 1: Should I Use RPC or REST?

```
START: Do you need an API?
│
├─ YES → Are you building a public API?
│        │
│        ├─ YES → Use REST/OpenAPI
│        │        (industry standard, easier discoverability)
│        │
│        └─ NO → Do you have a desktop app (Electron/Tauri)?
│                 │
│                 ├─ YES → Use RPC
│                 │        (shared protocol across platforms)
│                 │
│                 └─ NO → Is this a microservice backend?
│                         │
│                         ├─ YES → Use RPC
│                         │        (internal service communication)
│                         │
│                         └─ NO → Use REST
│                                 (simpler, more conventional)
│
└─ NO → Don't build an API yet
```

### Decision 2: How to Structure RPC Maps?

```
START: Defining RPC operations
│
├─ Single operation (login)?
│  └─ Use simple map: { 'auth:login': [Req, Res] }
│
├─ Multiple related operations (crud)?
│  └─ Use domain-grouped map:
│     {
│       'user:get': [GetReq, GetRes],
│       'user:list': [ListReq, ListRes],
│       'user:create': [CreateReq, CreateRes],
│     }
│
├─ Operations across multiple domains?
│  └─ Create separate RPC maps per domain:
│     AuthRpcMap, UserRpcMap, TaskRpcMap, etc.
│     Combine at router level
│
└─ Very large API (100+ operations)?
   └─ Use versioning:
      {
        'api:v1:operation': [Req, Res],
        'api:v2:operation': [Req, Res],
      }
```

### Decision 3: Where Should Validation Happen?

```
START: When to validate?
│
├─ Payload structure (required fields, types)?
│  └─ Middleware level with Zod schema
│     (Consistent, reusable, testable)
│
├─ Business logic constraints (email unique)?
│  └─ Application service layer
│     (Has database access, proper error context)
│
├─ Security constraints (permission check)?
│  └─ Handler level with context
│     (Has access to user/auth info)
│
└─ Cross-field validation (password match)?
   └─ Zod schema with .refine()
      (Done early in pipeline)
```

### Decision 4: DTO vs Entity - What to Return?

```
START: Deciding response type
│
├─ Is this exposed to external client?
│  │
│  └─ YES → MUST return DTO
│           - Filter sensitive fields
│           - Map custom objects
│           - Example: ❌ user.passwordHash ❌ user._id
│
└─ Is this internal service call?
   │
   ├─ YES, called from same process?
   │  └─ CAN return entity
   │     (Faster, direct access)
   │
   └─ YES, called from other service?
      └─ SHOULD return DTO
         (Contract is explicit, versioned)
```

### Decision 5: Request DTO Structure

```
START: Designing request DTO
│
├─ Does client need to provide this field?
│  │
│  ├─ NO (auto-generated id, timestamps)?
│  │  └─ REMOVE from RequestReq
│  │     Server generates: id, createdAt, accountId, etc.
│  │
│  └─ YES → Include in RequestReq
│
├─ Should field be optional?
│  │
│  ├─ No sensible default → Required
│  │
│  └─ Has default value → Optional
│
└─ Should field be nested?
   │
   ├─ Flat structure (< 5 fields)?
   │  └─ Use flat object
   │
   └─ Complex structure (> 5 fields)?
      └─ Use nested objects
         { user: { name, email }, address: { ... } }
```

### Decision 6: Error Handling Strategy

```
START: Error handling approach
│
├─ Client recoverable error (validation)?
│  └─ Return 422 with error details
│     { success: false, error: { code: 'VALIDATION_ERROR', details: [...] } }
│
├─ Auth error (not authenticated)?
│  └─ Return 401 with message
│     { success: false, error: { code: 'AUTHENTICATION_ERROR' } }
│
├─ Auth error (no permission)?
│  └─ Return 403 with message
│     { success: false, error: { code: 'AUTHORIZATION_ERROR' } }
│
├─ Resource not found?
│  └─ Return 404
│     { success: false, error: { code: 'NOT_FOUND' } }
│
└─ Server error (unexpected)?
   └─ Return 500, log, hide details
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } }
```

---

## Architectural Patterns

### Pattern 1: Domain-Based RPC Organization

**When**: You have multiple domains (auth, user, task, etc.)

**Structure**:
```
packages/contracts/
├── modules/
│   ├── auth/
│   │   ├── api/
│   │   │   ├── login.ts (LoginReq, LoginRes)
│   │   │   ├── register.ts (RegisterReq, RegisterRes)
│   │   │   └── index.ts
│   │   └── protocol/
│   │       ├── auth-rpc-map.ts
│   │       └── auth-event-map.ts
│   │
│   ├── user/
│   │   ├── api/
│   │   │   ├── get-user.ts (GetUserReq, GetUserRes)
│   │   │   ├── list-users.ts (ListUsersReq, ListUsersRes)
│   │   │   └── index.ts
│   │   └── protocol/
│   │       ├── user-rpc-map.ts
│   │       └── user-event-map.ts
│   │
│   └── task/
│       ├── api/
│       └── protocol/

apps/api/src/
├── modules/
│   ├── auth/interface/
│   │   ├── auth-rpc.routes.ts (RPC handlers)
│   │   ├── auth-http.routes.ts (REST endpoints)
│   │   └── index.ts
│   │
│   ├── user/interface/
│   │   ├── user-rpc.routes.ts
│   │   ├── user-http.routes.ts
│   │   └── index.ts
│   │
│   └── shared/infrastructure/rpc/
│       ├── rpcRouter.ts (RpcRouter class)
│       ├── rpcMiddleware.ts (validation, error handling)
│       └── rpcErrors.ts (error classes)
```

**Advantages**:
- Clear separation of concerns
- Easy to find related operations
- Scalable to many domains
- Protocol-agnostic (can add HTTP separately)

**Disadvantages**:
- More files to maintain
- Requires good project organization

---

### Pattern 2: Operation-Based RPC Organization

**When**: You have a few complex operations per domain

**Structure**:
```
packages/contracts/src/
├── operations/
│   ├── auth/
│   │   ├── login.ts (LoginReq, LoginRes, LoginSchema)
│   │   ├── register.ts (RegisterReq, RegisterRes, RegisterSchema)
│   │   └── operations.ts (AuthRpcMap combining all)
│   │
│   └── user/
│       ├── get.ts (GetUserReq, GetUserRes)
│       └── operations.ts (UserRpcMap)

apps/api/src/
├── rpc/
│   ├── auth/
│   │   ├── login.handler.ts
│   │   ├── register.handler.ts
│   │   └── index.ts (router setup)
│   │
│   └── user/
│       ├── get.handler.ts
│       └── index.ts
```

**Advantages**:
- Co-locates request, response, and handler
- Easier to refactor single operation
- Clear operation boundaries

**Disadvantages**:
- More granular file structure
- Harder to see all operations at once

---

### Pattern 3: Layered RPC Architecture

**When**: You want strict separation between interfaces and business logic

**Structure**:
```
┌────────────────────────────────────────┐
│  RPC Layer (apps/api/src/interface/)   │
│  - Validates requests                  │
│  - Maps domain → DTO                   │
│  - Wraps responses                     │
└────────────────────────────────────────┘
            ↓ calls
┌────────────────────────────────────────┐
│  Application Service Layer             │
│  (packages/application-server/)        │
│  - Business logic                      │
│  - Orchestration                       │
│  - Error handling                      │
└────────────────────────────────────────┘
            ↓ uses
┌────────────────────────────────────────┐
│  Domain Layer                          │
│  (packages/domain-server/)             │
│  - Entities & value objects            │
│  - Domain rules                        │
│  - Aggregates                          │
└────────────────────────────────────────┘
            ↓ uses
┌────────────────────────────────────────┐
│  Infrastructure Layer                  │
│  - Database                            │
│  - External services                   │
│  - File storage                        │
└────────────────────────────────────────┘
```

**Benefits**:
- Clear responsibilities
- Easy to test each layer
- Can swap implementations
- Protocol-agnostic business logic

---

### Pattern 4: Unified Protocol with HTTP Fallback

**When**: You want RPC as primary, HTTP as fallback

**Structure**:
```
// RPC first
POST /api/rpc
Body: { action: 'auth:login', payload: {...} }

// HTTP alternative (REST)
POST /api/auth/login
Body: {...}

// Both use same validation and business logic
rpc.handle('auth:login', handler);
router.post('/auth/login', (req) => handler(req.body));
```

**Implementation**:
```typescript
async function handleLogin(req: LoginReq): Promise<LoginRes> {
  // Shared business logic
  const service = await AuthService.getInstance();
  return service.login(req.email, req.password);
}

// RPC handler
rpc.handle('auth:login', handleLogin);

// HTTP handler
router.post('/auth/login', async (req, res) => {
  try {
    const result = await handleLogin(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

**Advantages**:
- Single business logic implementation
- Support multiple clients
- Easy migration path

---

## Type Safety Patterns

### Pattern 1: Strict Type Enforcement

```typescript
// ✅ GOOD: Compiler enforces correct types
async function handler<K extends keyof AuthRpcMap>(
  action: K,
  req: AuthRpcMap[K][0],
): Promise<AuthRpcMap[K][1]> {
  // TypeScript knows the exact req and return type
  switch (action) {
    case 'auth:login':
      // req is LoginReq
      // Must return LoginRes
      const result = await authService.login(req.email, req.password);
      return mapToLoginRes(result);
    
    case 'auth:register':
      // req is RegisterReq
      // Must return RegisterRes
      return await authService.register(req);
  }
}
```

### Pattern 2: Generic Handler Factory

```typescript
// Create type-safe handlers with factory pattern
export function createRpcHandler<
  TReq,
  TRes,
>(
  validator: z.ZodSchema<TReq>,
  handler: (req: TReq, ctx: RpcContext) => Promise<TRes>,
) {
  return async (req: any, ctx: RpcContext): Promise<TRes> => {
    const validated = await validator.parseAsync(req);
    return handler(validated, ctx);
  };
}

// Usage
const loginHandler = createRpcHandler(
  LoginReqSchema,
  async (req, ctx) => {
    // req is typed as LoginReq
    // Must return LoginRes
    return await authService.login(req.email, req.password);
  },
);
```

### Pattern 3: Type-Safe Client Generator

```typescript
// Generate client from RPC map types
export function createRpcClient<TRpcMap extends Record<string, [any, any]>>(
  baseUrl: string,
) {
  return {
    async call<K extends keyof TRpcMap>(
      action: K,
      payload: TRpcMap[K][0],
    ): Promise<TRpcMap[K][1]> {
      const response = await fetch(`${baseUrl}/rpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
  };
}

// Usage
import type { AuthRpcMap } from '@dailyuse/contracts/auth';
const client = createRpcClient<AuthRpcMap>('/api/auth');

// ✅ TypeScript knows:
// - 'auth:login' exists
// - First arg must be LoginReq
// - Return type is LoginRes
const result = await client.call('auth:login', {
  email: 'user@example.com',
  password: 'password123',
});
// result is typed as LoginRes
```

---

## Comparison: RPC Map Patterns

### Pattern A: Inline Types (Simple)

```typescript
export type AuthRpcMap = {
  'auth:login': [LoginReq, LoginRes];
  'auth:register': [RegisterReq, RegisterRes];
};
```

**Pros**: Simple, all in one place
**Cons**: Hard to scale, mixed concerns

---

### Pattern B: Grouped by Operation (Recommended)

```typescript
// packages/contracts/src/modules/auth/api/
export * from './login';
export * from './register';

// packages/contracts/src/modules/auth/protocol/
import type {
  LoginReq, LoginRes,
  RegisterReq, RegisterRes,
} from '../api';

export type AuthRpcMap = {
  'auth:login': [LoginReq, LoginRes];
  'auth:register': [RegisterReq, RegisterRes];
};
```

**Pros**: Organized, easy to find operations, scalable
**Cons**: More files

---

### Pattern C: With Validation Schemas

```typescript
// packages/contracts/src/modules/auth/api/login.ts
export const LoginReqSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginReq = z.infer<typeof LoginReqSchema>;
export interface LoginRes { ... }

// packages/contracts/src/modules/auth/protocol/auth-rpc-map.ts
import type { LoginReq, LoginRes } from '../api';
export type AuthRpcMap = {
  'auth:login': [LoginReq, LoginRes];
};

// apps/api/src/modules/auth/interface/auth-rpc.routes.ts
import { LoginReqSchema } from '@dailyuse/contracts/auth';
rpc.handle('auth:login', handler, (req) => LoginReqSchema.parseAsync(req));
```

**Pros**: Complete validation contract, reusable schemas
**Cons**: Three files per operation

---

## Performance Considerations

### 1. Payload Size Optimization

```typescript
// ❌ WRONG: Returning unnecessary fields
interface UserRes {
  id: string;
  email: string;
  name: string;
  internalMetadata: Record<string, any>; // 10KB!
  auditLog: AuditEntry[]; // 100KB!
  allPermissions: Permission[]; // Large array
}

// ✅ CORRECT: Minimal response
interface UserRes {
  id: string;
  email: string;
  name: string;
  // Only what client needs
}

// Large data loaded on-demand
interface UserDetailRes extends UserRes {
  auditLog?: AuditEntry[]; // Optional, lazy-load
  allPermissions?: Permission[]; // Optional
}
```

### 2. Batching Operations

```typescript
// ❌ SLOW: Multiple RPC calls
await rpc.call('user:get', { id: '1' });
await rpc.call('user:get', { id: '2' });
await rpc.call('user:get', { id: '3' });

// ✅ FAST: Batch operation
interface BatchGetUsersReq {
  ids: string[];
}
interface BatchGetUsersRes {
  users: UserDTO[];
}

export type UserRpcMap = {
  'user:batch-get': [BatchGetUsersReq, BatchGetUsersRes];
};

await rpc.call('user:batch-get', { ids: ['1', '2', '3'] });
```

### 3. Caching Responses

```typescript
// Client-side caching
export function useUserRpc() {
  const cache = new Map<string, UserDTO>();

  async function getUser(id: string): Promise<UserDTO> {
    if (cache.has(id)) return cache.get(id)!;

    const result = await rpc.call('user:get', { id });
    cache.set(id, result);
    return result;
  }

  return { getUser };
}
```

---

## Testing Patterns

### Pattern 1: Handler Unit Tests

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AuthRpcMap } from '@dailyuse/contracts/auth';
import { RpcRouter } from '@/infrastructure/rpc/rpcRouter';

describe('Auth RPC Handlers', () => {
  let rpc: RpcRouter<AuthRpcMap>;
  let mockAuthService: any;

  beforeEach(() => {
    rpc = new RpcRouter<AuthRpcMap>();
    mockAuthService = {
      login: vi.fn().mockResolvedValue({
        token: 'test-token',
        user: { id: '1', email: 'test@example.com', name: 'Test' },
      }),
    };
  });

  it('should handle valid login request', async () => {
    rpc.handle('auth:login', async (req) => {
      const result = await mockAuthService.login(req.email, req.password);
      return {
        accessToken: result.token,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
      };
    });

    const handler = rpc.middleware();
    const req = {
      body: {
        action: 'auth:login',
        payload: { email: 'test@example.com', password: 'password123' },
      },
      user: undefined,
    };
    const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

    await handler(req as any, res as any, vi.fn());

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          accessToken: 'test-token',
        }),
      }),
    );
  });

  it('should return 422 for validation error', async () => {
    const handler = rpc.middleware();
    const req = {
      body: {
        action: 'auth:login',
        payload: { email: 'invalid-email', password: '123' }, // Invalid
      },
    };
    const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

    await handler(req as any, res as any, vi.fn());

    expect(res.status).toHaveBeenCalledWith(422);
  });
});
```

### Pattern 2: Integration Tests

```typescript
import { createTestClient } from 'supertest';
import app from '@/app';

describe('Auth RPC Integration', () => {
  const client = createTestClient(app);

  it('should login and return token', async () => {
    const response = await client.post('/api/auth/rpc').send({
      action: 'auth:login',
      payload: {
        email: 'user@example.com',
        password: 'password123',
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.user.id).toBeDefined();
  });
});
```

---

## Migration Path: REST → RPC

### Phase 1: Add RPC alongside REST (1 operation)

```typescript
// Existing REST endpoint
router.post('/auth/login', async (req, res) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add RPC endpoint
const rpc = new RpcRouter<AuthRpcMap>();
rpc.handle('auth:login', async (req) => {
  return await authService.login(req);
});
router.post('/rpc', rpc.middleware());
```

### Phase 2: Extract shared logic

```typescript
async function loginHandler(req: LoginReq): Promise<LoginRes> {
  const result = await authService.login(req.email, req.password);
  return mapUserToDto(result);
}

// REST uses it
router.post('/auth/login', async (req, res) => {
  const result = await loginHandler(req.body);
  res.json(result);
});

// RPC uses same handler
rpc.handle('auth:login', loginHandler);
```

### Phase 3: Deprecate REST, full RPC

- Mark REST endpoints as deprecated
- Migrate clients to RPC
- Remove REST endpoints in next major version

---

## Summary

### Choose RPC If:
- Building cross-platform apps (desktop + web)
- Need explicit request/response contracts
- Microservice architecture
- Want type-safe clients

### Choose REST If:
- Public API (third-party integration)
- Following OpenAPI/Swagger standard
- Simple CRUD operations
- Team familiar with REST conventions

### Best Practices:
- Always use DTOs in RPC maps
- Never expose domain entities
- Validate at middleware level
- Map domain → DTO in handlers
- Use Zod for request schemas
- Keep errors standardized
- Version RPC operations
- Test handlers thoroughly
- Document all operations
