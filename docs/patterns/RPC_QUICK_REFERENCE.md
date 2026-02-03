# RPC Protocol - Quick Reference & Checklists

## Quick Start Checklist

### 1. Define Protocol (15 minutes)

- [ ] Create request DTO with Zod schema
  ```typescript
  export const LoginReqSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });
  export type LoginReq = z.infer<typeof LoginReqSchema>;
  ```

- [ ] Create response DTO interface
  ```typescript
  export interface LoginRes {
    accessToken: string;
    user: { id: string; email: string; name: string };
  }
  ```

- [ ] Add to RPC map
  ```typescript
  export type AuthRpcMap = {
    'auth:login': [LoginReq, LoginRes];
  };
  ```

### 2. Implement Handler (10 minutes)

- [ ] Create handler in route file
- [ ] Register with RpcRouter
- [ ] Map domain entity to DTO
- [ ] Return response DTO

### 3. Wire Up (5 minutes)

- [ ] Add route to app.ts
- [ ] Test with curl/Postman

---

## File Structure Template

```
packages/contracts/src/modules/[domain]/
├── api/
│   ├── [operation1].ts          (Req, Res DTOs + schemas)
│   ├── [operation2].ts
│   └── index.ts
├── protocol/
│   ├── [domain]-rpc-map.ts     (RpcMap type)
│   ├── [domain]-event-map.ts
│   └── index.ts
├── entities/                     (Domain entities - not exposed)
├── aggregates/
│   └── [entity].ts
├── value-objects/
├── dtos/                        (Response-specific DTOs)
└── index.ts

apps/api/src/modules/[domain]/interface/
├── [domain]-rpc.routes.ts       (RPC handlers)
├── [domain]-http.routes.ts      (Optional: REST endpoints)
├── index.ts
└── __tests__/
    └── [domain]-rpc.routes.test.ts

apps/api/src/shared/infrastructure/rpc/
├── rpcRouter.ts                 (RpcRouter class)
├── rpcMiddleware.ts             (Validation, response wrapping)
├── rpcErrors.ts                 (Error types)
└── __tests__/
    └── rpcRouter.test.ts
```

---

## Type Definition Patterns

### Simple Operation

```typescript
// Login operation
export interface LoginReq {
  email: string;
  password: string;
}

export interface LoginRes {
  accessToken: string;
  user: UserDTO;
}

export type AuthRpcMap = {
  'auth:login': [LoginReq, LoginRes];
};
```

### Void Operation

```typescript
// Logout (no return value)
export type AuthRpcMap = {
  'auth:logout': [void, void];
};
```

### Optional Response

```typescript
// List with pagination
export interface ListUsersReq {
  page: number;
  limit: number;
}

export interface ListUsersRes {
  items: UserDTO[];
  total: number;
  hasMore: boolean;
}

export type UserRpcMap = {
  'user:list': [ListUsersReq, ListUsersRes];
};
```

### Nested Objects

```typescript
// Complex request
export interface CreateTaskReq {
  title: string;
  description: string;
  assignee: {
    id: string;
    email: string;
  };
  schedule: {
    startDate: string;
    endDate: string;
    recurrence?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  };
}

export interface CreateTaskRes {
  id: string;
  createdAt: string;
}

export type TaskRpcMap = {
  'task:create': [CreateTaskReq, CreateTaskRes];
};
```

---

## Common DTOs Template

### User DTO

```typescript
export interface UserDTO {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

export interface UserDetailDTO extends UserDTO {
  phone?: string;
  bio?: string;
  roles: string[];
}
```

### Error Response

```typescript
export interface RpcError {
  code: 'VALIDATION_ERROR' | 'AUTHENTICATION_ERROR' | 
        'AUTHORIZATION_ERROR' | 'NOT_FOUND' | 'INTERNAL_ERROR';
  message: string;
  details?: Record<string, any>;
}

export interface RpcErrorResponse {
  success: false;
  data: null;
  error: RpcError;
}
```

### Success Response

```typescript
export interface RpcSuccessResponse<T> {
  success: true;
  data: T;
  error: null;
}
```

---

## Handler Implementation Patterns

### Basic Handler

```typescript
rpc.handle(
  'user:get',
  async (req: GetUserReq): Promise<GetUserRes> => {
    const service = await UserService.getInstance();
    const user = await service.getById(req.id);
    return mapUserToDto(user);
  },
);
```

### Handler with Validation

```typescript
rpc.handle(
  'user:create',
  async (req: CreateUserReq): Promise<CreateUserRes> => {
    const service = await UserService.getInstance();
    const user = await service.create(req);
    return { id: user.id, createdAt: user.createdAt.toISOString() };
  },
  async (req) => {
    await CreateUserSchema.parseAsync(req);
  },
);
```

### Handler with Context

```typescript
rpc.handle(
  'task:create',
  async (req: CreateTaskReq, ctx: RpcContext): Promise<CreateTaskRes> => {
    if (!ctx.userId) throw new AuthenticationError();
    
    const service = await TaskService.getInstance();
    const task = await service.create({
      ...req,
      createdBy: ctx.userId,
      accountId: ctx.accountId,
    });
    
    return { id: task.id, createdAt: task.createdAt.toISOString() };
  },
);
```

### Handler with Authorization

```typescript
rpc.handle(
  'user:delete',
  async (req: DeleteUserReq, ctx: RpcContext): Promise<DeleteUserRes> => {
    if (!ctx.userId) throw new AuthenticationError();
    if (!hasPermission(ctx.userId, 'user:delete')) {
      throw new AuthorizationError('Cannot delete users');
    }
    
    const service = await UserService.getInstance();
    await service.delete(req.id);
    
    return { success: true };
  },
);
```

---

## Validation Patterns

### Zod Schema Types

```typescript
import { z } from 'zod';

// Basic types
z.string()
z.number()
z.boolean()
z.date()
z.enum(['A', 'B', 'C'])
z.array(z.string())
z.object({ ... })

// With validation
z.string().min(8).max(100)
z.string().email()
z.string().url()
z.string().uuid()
z.number().int().positive()
z.array(z.string()).min(1) // at least 1 item

// Optional
z.string().optional()
z.string().nullable()

// Default
z.string().default('default-value')

// Custom validation
z.string().refine(
  (val) => /^[A-Z]/.test(val),
  'Must start with uppercase'
)

// Async validation
z.string().refine(
  async (email) => !(await emailExists(email)),
  'Email already registered'
)

// Cross-field validation
z.object({
  password: z.string(),
  confirm: z.string(),
}).refine(
  (data) => data.password === data.confirm,
  { message: "Passwords don't match", path: ['confirm'] }
)
```

### Common Request Schemas

```typescript
// Login
export const LoginReqSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Register
export const RegisterReqSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  name: z.string().min(2),
}).refine(
  (data) => data.password === data.passwordConfirm,
  { message: "Passwords don't match" }
);

// List/Pagination
export const ListReqSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sort: z.string().optional(),
  filter: z.string().optional(),
});

// Update
export const UpdateReqSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
  name: z.string().optional(),
}).refine(
  (data) => Object.keys(data).length > 1, // at least one field besides id
  "Must provide at least one field to update"
);

// Delete
export const DeleteReqSchema = z.object({
  id: z.string().uuid(),
});
```

---

## Error Handling Quick Reference

### Error Types

```typescript
throw new ValidationError('Email is invalid');
// → 422 VALIDATION_ERROR

throw new AuthenticationError('Not logged in');
// → 401 AUTHENTICATION_ERROR

throw new AuthorizationError('No permission');
// → 403 AUTHORIZATION_ERROR

throw new NotFoundError('User not found');
// → 404 NOT_FOUND

throw new Error('Database error');
// → 500 INTERNAL_ERROR (stack hidden in prod)
```

### Error with Details

```typescript
throw new ValidationError(
  'Validation failed',
  {
    email: 'Invalid format',
    password: 'Too short',
  }
);

// Response:
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    details: {
      email: 'Invalid format',
      password: 'Too short'
    }
  }
}
```

---

## Client Usage Examples

### JavaScript/TypeScript

```typescript
import type { AuthRpcMap } from '@dailyuse/contracts/auth';

async function login(email: string, password: string) {
  const response = await fetch('/api/auth/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'auth:login',
      payload: { email, password },
    }),
  });

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error.message);
  }

  return result.data; // Typed as LoginRes
}
```

### React Hook

```typescript
import { useState } from 'react';
import type { AuthRpcMap } from '@dailyuse/contracts/auth';

export function useRpc<K extends keyof AuthRpcMap>(baseUrl = '/api') {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call(
    action: K,
    payload: AuthRpcMap[K][0],
  ): Promise<AuthRpcMap[K][1]> {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/rpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error.message);
      }

      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { call, loading, error };
}

// Usage
export function LoginForm() {
  const { call, loading, error } = useRpc();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const result = await call('auth:login', {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
      });
      
      localStorage.setItem('token', result.accessToken);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit" disabled={loading}>
        {loading ? 'Loading...' : 'Login'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
```

---

## Middleware Stack Order

```
Request
  ↓
1. Express body parser
  ↓
2. Authentication middleware (req.user)
  ↓
3. RPC validation middleware (Zod)
  ↓
4. RPC handler middleware (execute handler)
  ↓
5. RPC response wrapping middleware
  ↓
6. Error handling middleware
  ↓
Response
```

---

## Performance Checklist

- [ ] Use pagination for list operations (page, limit)
- [ ] Filter unnecessary fields in responses
- [ ] Cache frequently accessed data on client
- [ ] Batch operations when possible
- [ ] Use compression (gzip)
- [ ] Index database fields used in queries
- [ ] Implement rate limiting on RPC endpoints
- [ ] Use connection pooling
- [ ] Lazy-load large related data
- [ ] Monitor slow RPC operations

---

## Security Checklist

- [ ] Validate all RPC request payloads
- [ ] Authenticate before processing (except public operations)
- [ ] Check authorization in handler
- [ ] Never expose sensitive fields (passwords, tokens)
- [ ] Use HTTPS in production
- [ ] Implement rate limiting
- [ ] Sanitize error messages (no stack traces)
- [ ] Log RPC operations for audit trail
- [ ] Use CSRF tokens if needed
- [ ] Validate payload size limits
- [ ] Escape user input in error messages
- [ ] Use parameterized queries (ORM)

---

## Testing Checklist

- [ ] Test valid request scenarios
- [ ] Test validation error (422)
- [ ] Test authentication error (401)
- [ ] Test authorization error (403)
- [ ] Test not found (404)
- [ ] Test server error handling
- [ ] Test missing action
- [ ] Test handler execution
- [ ] Test domain → DTO mapping
- [ ] Test concurrent requests
- [ ] Test request with null/undefined fields
- [ ] Test large payloads
- [ ] Test error response format

---

## Code Review Checklist

### RPC Map Definition
- [ ] Request type is DTO with required/optional fields
- [ ] Response type is DTO, never entity
- [ ] Both types are properly exported
- [ ] RPC map has clear action names (namespace:operation)
- [ ] Documentation for each operation

### Handler Implementation
- [ ] Handler signature matches RPC map
- [ ] Validates input using Zod
- [ ] Maps domain entity to response DTO
- [ ] Handles errors appropriately
- [ ] Includes authentication/authorization checks
- [ ] Has proper logging

### DTO Definitions
- [ ] No internal fields exposed
- [ ] No generated fields in request DTO
- [ ] Response DTO only has client-displayable data
- [ ] Fields properly typed
- [ ] Optional fields clearly marked

### Validation
- [ ] Zod schemas match DTO types
- [ ] Custom validation rules present
- [ ] Async validation for unique constraints
- [ ] Error messages are user-friendly
- [ ] Validation happens in middleware

### Error Handling
- [ ] Uses standard error types
- [ ] Appropriate HTTP status codes
- [ ] Error messages don't expose internals
- [ ] Details only in development
- [ ] Errors logged appropriately

---

## Troubleshooting Guide

### Problem: Types don't match between client and server

**Solution**: Ensure both import from same contracts package
```typescript
// ✅ Correct
import type { AuthRpcMap } from '@dailyuse/contracts/auth';

// ❌ Wrong
import type { AuthRpcMap } from './local-types';
```

### Problem: Validation fails but schema looks correct

**Solution**: Check async validation and refinements
```typescript
// Might be async validation failing
z.object({...}).refine(
  async (data) => {
    console.log('Validating...', data);
    return true;
  }
);
```

### Problem: Domain entity exposed in response

**Solution**: Map entity to DTO explicitly
```typescript
// ❌ Wrong
return domainEntity;

// ✅ Correct
return {
  id: domainEntity.id,
  email: domainEntity.email,
  name: domainEntity.name,
};
```

### Problem: Can't find RPC action

**Solution**: Verify action is registered and request format is correct
```typescript
// Request must match:
{
  action: 'auth:login',      // ← exact key from RPC map
  payload: { email, password } // ← request DTO
}
```

### Problem: Authorization always fails

**Solution**: Ensure context is properly extracted
```typescript
// RPC context requires user info
const context: RpcContext = {
  userId: req.user?.id,      // ← must be populated
  accountId: req.user?.accountId,
};
```

---

## Key Metrics to Monitor

```
1. RPC Operation Success Rate
   = (successful calls) / (total calls) × 100
   Target: > 99.5%

2. Average Response Time by Operation
   = sum(response times) / count
   Target: < 200ms for most operations

3. Validation Error Rate
   = (validation failures) / (total calls) × 100
   Target: < 5% (indicates client bugs)

4. Authorization Error Rate
   = (denied requests) / (authenticated calls) × 100
   Target: < 1% (indicates permission issues)

5. Payload Size (Bytes)
   = sum(response sizes) / count
   Target: < 50KB median per response
```

---

## References

1. **Your workspace conventions**: See ADR-021 and ADR-022 in docs/architecture
2. **RPC Best Practices**: See RPC_PROTOCOL_BEST_PRACTICES.md
3. **Implementation Toolkit**: See RPC_IMPLEMENTATION_TOOLKIT.md
4. **Architecture Decisions**: See RPC_ARCHITECTURE_DECISIONS.md
5. **Zod Documentation**: https://zod.dev
6. **Express Documentation**: https://expressjs.com

---

## Common Questions

**Q: Should I use RPC or REST?**
A: Use RPC if you have desktop apps or microservices. Use REST if public API. Both can coexist.

**Q: How do I version RPC operations?**
A: Add version to action name: 'auth:login-v2' or create new RPC map.

**Q: Can I return null from handler?**
A: Only if response type explicitly allows it. Use `type | null`.

**Q: Should request DTO have id field?**
A: No. Server generates id. Only include fields client provides.

**Q: Where do I validate complex business logic?**
A: In application service, not RPC handler. Handler only maps/wraps.

**Q: How do I handle file uploads in RPC?**
A: Use multipart/form-data, or upload separately then reference by ID.

**Q: Can I nest RPC calls?**
A: Avoid it. Call services directly, not other RPC handlers.

**Q: How do I document RPC operations?**
A: Use JSDoc comments and maintain API documentation separate from code.

---

Last updated: 2026-02-03
