# RPC Protocol Implementation Toolkit - Code Templates

## Quick Reference Templates

### Template 1: Basic RPC Handler (Copy & Paste)

```typescript
// File: packages/contracts/src/modules/[domain]/api/[operation].ts
import { z } from 'zod';

// 1. Define request schema using Zod
export const [OperationCapital]ReqSchema = z.object({
  // Define required fields with validation rules
  field1: z.string().min(1, 'Field1 is required'),
  field2: z.number().positive('Field2 must be positive'),
});

// 2. Export types
export type [OperationCapital]Req = z.infer<typeof [OperationCapital]ReqSchema>;

export interface [OperationCapital]Res {
  // Define response fields
  id: string;
  status: 'success' | 'pending';
  message: string;
}

// ---

// File: packages/contracts/src/modules/[domain]/protocol/[domain]-rpc-map.ts
import type {
  [OperationCapital]Req,
  [OperationCapital]Res,
} from '../api';

export type [DomainCapital]RpcMap = {
  '[domain]:[operation]': [[OperationCapital]Req, [OperationCapital]Res];
};

// ---

// File: apps/api/src/modules/[domain]/interface/[domain]-rpc.routes.ts
import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { [DomainCapital]RpcMap } from '@dailyuse/contracts/[domain]';
import { RpcRouter } from '@/shared/infrastructure/rpc/rpcRouter';
import { [DomainCapital]ApplicationService } from '@dailyuse/application-server';
import { authMiddleware } from '@/shared/infrastructure/http/middlewares';

export function register[DomainCapital]RpcRoutes(): Router {
  const router = ExpressRouter();
  const rpc = new RpcRouter<[DomainCapital]RpcMap>();

  rpc.handle(
    '[domain]:[operation]',
    async (req, ctx) => {
      const service = await [DomainCapital]ApplicationService.getInstance();
      
      // Call service
      const domainResult = await service.[operationMethod](req);
      
      // Map domain entity to response DTO
      return {
        id: domainResult.id,
        status: domainResult.status,
        message: 'Operation successful',
      };
    },
  );

  router.post('/rpc', authMiddleware, rpc.middleware());
  return router;
}
```

### Template 2: RPC Router Implementation

```typescript
// File: apps/api/src/shared/infrastructure/rpc/rpcRouter.ts
import type { Request, Response, NextFunction } from 'express';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('RpcRouter');

export interface RpcContext {
  userId?: string;
  accountId?: string;
  metadata?: Record<string, any>;
}

export type RpcHandler<TReq, TRes> = (
  req: TReq,
  context: RpcContext,
) => Promise<TRes> | TRes;

type RpcMap = Record<string, [any, any]>;

export class RpcRouter<TRpcMap extends RpcMap = RpcMap> {
  private handlers = new Map<string, RpcHandler<any, any>>();
  private validators = new Map<string, (data: any) => Promise<void> | void>();

  handle<K extends keyof TRpcMap>(
    action: K,
    handler: RpcHandler<TRpcMap[K][0], TRpcMap[K][1]>,
    validator?: (req: TRpcMap[K][0]) => Promise<void> | void,
  ): this {
    const actionStr = String(action);
    
    if (this.handlers.has(actionStr)) {
      logger.warn(`⚠️ Overwriting handler for RPC action: ${actionStr}`);
    }
    
    this.handlers.set(actionStr, handler);
    if (validator) {
      this.validators.set(actionStr, validator);
    }
    
    return this;
  }

  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const action = req.body?.action as string;
        const payload = req.body?.payload;

        if (!action) {
          return res.status(400).json({
            success: false,
            data: null,
            error: {
              code: 'INVALID_RPC_REQUEST',
              message: 'Missing "action" field',
            },
          });
        }

        const handler = this.handlers.get(action);
        if (!handler) {
          return res.status(404).json({
            success: false,
            data: null,
            error: {
              code: 'RPC_ACTION_NOT_FOUND',
              message: `No handler registered for action: ${action}`,
            },
          });
        }

        const validator = this.validators.get(action);
        if (validator) {
          try {
            await validator(payload);
          } catch (validationError) {
            return res.status(422).json({
              success: false,
              data: null,
              error: {
                code: 'VALIDATION_ERROR',
                message: validationError instanceof Error 
                  ? validationError.message 
                  : 'Validation failed',
              },
            });
          }
        }

        const context: RpcContext = {
          userId: req.user?.id,
          accountId: req.user?.accountId,
          metadata: {
            ip: req.ip,
            userAgent: req.get('user-agent'),
            timestamp: new Date().toISOString(),
          },
        };

        logger.info(`[RPC] Executing: ${action}`);
        const result = await handler(payload, context);

        return res.json({
          success: true,
          data: result,
          error: null,
        });
      } catch (error) {
        logger.error(`[RPC] Error:`, error);
        return res.status(500).json({
          success: false,
          data: null,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
            ...(process.env.NODE_ENV === 'development' && {
              stack: error instanceof Error ? error.stack : undefined,
            }),
          },
        });
      }
    };
  }
}
```

### Template 3: Zod Schema Validation

```typescript
// File: packages/contracts/src/modules/[domain]/api/[operation].ts
import { z } from 'zod';

// Basic field validators
export const [OperationCapital]ReqSchema = z.object({
  // String fields
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  
  // Optional fields
  nickname: z.string().optional(),
  phone: z.string().optional().refine(
    (val) => !val || /^\d{10,}$/.test(val),
    'Invalid phone number'
  ),
  
  // Number fields
  age: z.number().int().positive('Age must be positive'),
  score: z.number().min(0).max(100, 'Score must be 0-100'),
  
  // Enum fields
  status: z.enum(['active', 'inactive', 'pending']),
  
  // Array fields
  tags: z.array(z.string()).min(1, 'At least one tag required'),
  
  // Nested objects
  address: z.object({
    street: z.string(),
    city: z.string(),
    zipCode: z.string(),
  }),
  
  // Date fields
  birthDate: z.coerce.date().optional(),
  
  // Boolean fields
  acceptTerms: z.boolean().refine(
    (val) => val === true,
    'Must accept terms'
  ),
});

export type [OperationCapital]Req = z.infer<typeof [OperationCapital]ReqSchema>;

// For response DTO (no Zod needed, just interface)
export interface [OperationCapital]Res {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  status: 'active' | 'inactive';
}
```

### Template 4: Entity-to-DTO Mapping Helper

```typescript
// File: apps/api/src/shared/infrastructure/mappers/entityMapper.ts
import type { User } from '@dailyuse/domain-server'; // Domain entity
import type { UserDTO } from '@dailyuse/contracts'; // Response DTO

/**
 * Maps User domain entity to UserDTO response
 * Filters out internal fields that shouldn't be exposed
 */
export function mapUserToDto(user: User): UserDTO {
  return {
    id: user.id,
    email: user.email,
    name: user.fullName,
    avatar: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
    // ❌ Do NOT include: passwordHash, internalFlags, auditLog, etc.
  };
}

/**
 * Maps multiple entities to DTOs
 */
export function mapUsersToDto(users: User[]): UserDTO[] {
  return users.map(mapUserToDto);
}

/**
 * Generic mapping helper
 */
export function mapEntityToDto<TEntity, TDto>(
  entity: TEntity,
  selector: (e: TEntity) => TDto,
): TDto {
  return selector(entity);
}
```

### Template 5: Validation with Custom Rules

```typescript
// File: packages/contracts/src/modules/auth/api/register.ts
import { z } from 'zod';

export const RegisterReqSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .toLowerCase(),
  
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  
  passwordConfirm: z.string(),
  
  name: z
    .string()
    .min(2, 'Name too short')
    .max(100, 'Name too long'),
})
.refine(
  (data) => data.password === data.passwordConfirm,
  {
    message: "Passwords don't match",
    path: ['passwordConfirm'],
  }
)
.refine(
  async (data) => {
    // Async validation: check if email already exists
    const existing = await checkEmailExists(data.email);
    return !existing;
  },
  {
    message: 'Email already registered',
    path: ['email'],
  }
);

export type RegisterReq = z.infer<typeof RegisterReqSchema>;

export interface RegisterRes {
  id: string;
  email: string;
  name: string;
  accessToken: string;
}
```

### Template 6: Error Handling Wrapper

```typescript
// File: apps/api/src/shared/infrastructure/rpc/rpcErrors.ts
export class RpcError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>,
  ) {
    super(message);
    this.name = 'RpcError';
  }
}

export class ValidationError extends RpcError {
  constructor(message: string, details?: Record<string, any>) {
    super('VALIDATION_ERROR', message, 422, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends RpcError {
  constructor(message = 'Not authenticated') {
    super('AUTHENTICATION_ERROR', message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends RpcError {
  constructor(message = 'Not authorized') {
    super('AUTHORIZATION_ERROR', message, 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends RpcError {
  constructor(message = 'Resource not found') {
    super('NOT_FOUND', message, 404);
    this.name = 'NotFoundError';
  }
}

// Usage in handler
async function handler(req: LoginReq, ctx: RpcContext): Promise<LoginRes> {
  if (!ctx.userId) {
    throw new AuthenticationError('User session required');
  }
  
  if (!hasPermission(ctx.userId, 'action:read')) {
    throw new AuthorizationError('Permission denied');
  }
  
  const user = await findUser(req.id);
  if (!user) {
    throw new NotFoundError(`User ${req.id} not found`);
  }
  
  return mapToDto(user);
}
```

### Template 7: Type-Safe Client Hook (React)

```typescript
// File: apps/web/src/hooks/useRpc.ts
import type { AuthRpcMap } from '@dailyuse/contracts/auth';

type RpcMap = AuthRpcMap; // Replace with your RPC map

interface RpcResponse<TData> {
  success: boolean;
  data?: TData;
  error?: {
    code: string;
    message: string;
  };
}

export function useRpc(baseUrl = '/api') {
  async function call<K extends keyof RpcMap>(
    action: K,
    payload: RpcMap[K][0],
  ): Promise<RpcMap[K][1]> {
    const response = await fetch(`${baseUrl}/rpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
    });

    const result: RpcResponse<RpcMap[K][1]> = await response.json();

    if (!result.success) {
      throw new Error(result.error?.message || 'RPC call failed');
    }

    return result.data!;
  }

  return { call };
}

// Usage
export function LoginForm() {
  const { call } = useRpc();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleLogin() {
    try {
      const result = await call('auth:login', { email, password });
      // result is fully typed as LoginRes
      console.log(result.accessToken);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
      {/* form fields */}
    </form>
  );
}
```

### Template 8: Multi-Operation RPC Handler

```typescript
// File: apps/api/src/modules/user/interface/user-rpc.routes.ts
import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { UserRpcMap } from '@dailyuse/contracts/user';
import { RpcRouter } from '@/shared/infrastructure/rpc/rpcRouter';
import { UserApplicationService } from '@dailyuse/application-server';
import { authMiddleware } from '@/shared/infrastructure/http/middlewares';
import { 
  GetUserSchema,
  UpdateUserSchema,
} from '@dailyuse/contracts/user/api';

export function registerUserRpcRoutes(): Router {
  const router = ExpressRouter();
  const rpc = new RpcRouter<UserRpcMap>();

  // Operation 1: Get user by ID
  rpc.handle(
    'user:get',
    async (req) => {
      const service = await UserApplicationService.getInstance();
      const user = await service.getById(req.id);
      if (!user) throw new NotFoundError('User not found');
      return mapUserToDto(user);
    },
    async (req) => {
      await GetUserSchema.parseAsync(req);
    },
  );

  // Operation 2: Update user
  rpc.handle(
    'user:update',
    async (req, ctx) => {
      if (!ctx.userId) throw new AuthenticationError();
      
      const service = await UserApplicationService.getInstance();
      const updated = await service.update(ctx.userId, req);
      return mapUserToDto(updated);
    },
    async (req) => {
      await UpdateUserSchema.parseAsync(req);
    },
  );

  // Operation 3: List users (admin only)
  rpc.handle(
    'user:list',
    async (req, ctx) => {
      if (!isAdmin(ctx.userId)) throw new AuthorizationError();
      
      const service = await UserApplicationService.getInstance();
      const users = await service.list(req.page, req.limit);
      return {
        items: users.map(mapUserToDto),
        total: users.length,
      };
    },
  );

  router.post('/rpc', authMiddleware, rpc.middleware());
  return router;
}
```

---

## Configuration Examples

### Express App Setup with RPC

```typescript
// File: apps/api/src/app.ts
import express from 'express';
import { registerAuthRpcRoutes } from './modules/auth/interface';
import { registerUserRpcRoutes } from './modules/user/interface';
import { authMiddleware } from './shared/infrastructure/http/middlewares';

const app = express();

// Global middleware
app.use(express.json());
app.use(authMiddleware);

// RPC routes
app.use('/api/auth', registerAuthRpcRoutes());
app.use('/api/user', registerUserRpcRoutes());

export default app;
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "lib": ["ES2020"],
    "module": "ESNext",
    "target": "ES2020",
    "allowSyntheticDefaultImports": true,
    "paths": {
      "@dailyuse/contracts/*": ["packages/contracts/src/*"],
      "@dailyuse/application-server": ["packages/application-server/src"],
      "@/": ["apps/api/src/"]
    }
  }
}
```

---

## Testing Templates

### Unit Test for RPC Handler

```typescript
// File: apps/api/src/modules/auth/interface/__tests__/auth-rpc.routes.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AuthRpcMap } from '@dailyuse/contracts/auth';
import { RpcRouter } from '@/shared/infrastructure/rpc/rpcRouter';

describe('AuthRpcRoutes', () => {
  let rpc: RpcRouter<AuthRpcMap>;

  beforeEach(() => {
    rpc = new RpcRouter<AuthRpcMap>();
  });

  it('should handle login request', async () => {
    const mockService = {
      login: vi.fn().mockResolvedValue({
        token: 'test-token',
        user: { id: '1', email: 'user@example.com', name: 'Test User' },
      }),
    };

    rpc.handle('auth:login', async (req) => {
      const result = await mockService.login(req.email, req.password);
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
        payload: { email: 'user@example.com', password: 'password123' },
      },
    } as any;
    
    const res = {
      json: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
    } as any;

    await handler(req, res, () => {});

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          accessToken: 'test-token',
        }),
      })
    );
  });

  it('should return error for missing action', async () => {
    const handler = rpc.middleware();
    const req = { body: { payload: {} } } as any;
    const res = {
      json: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
    } as any;

    await handler(req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_RPC_REQUEST',
        }),
      })
    );
  });
});
```

---

## Migration Checklist

### From REST to RPC

- [ ] Define RPC maps in `packages/contracts`
- [ ] Create request/response DTOs using Zod
- [ ] Implement RpcRouter in `shared/infrastructure/rpc`
- [ ] Create RPC route handlers in each module
- [ ] Update application services to support both interfaces
- [ ] Add validation middleware
- [ ] Add error handling middleware
- [ ] Update client code to use RPC calls
- [ ] Add tests for RPC handlers
- [ ] Document new RPC operations

---

## Performance Tips

1. **Batch operations**: Combine multiple requests in one RPC call
2. **Lazy loading**: Return minimal data in list operations, load details on demand
3. **Caching**: Cache frequently accessed RPC responses on client
4. **Compression**: Use gzip for RPC payloads
5. **Connection pooling**: Reuse database connections in handlers
6. **Async/await patterns**: Avoid blocking operations

---

## Security Checklist

- [ ] Validate all RPC request payloads with Zod
- [ ] Authenticate all RPC calls (except public operations)
- [ ] Check authorization in handlers
- [ ] Sanitize error messages (don't expose stack traces in production)
- [ ] Use HTTPS in production
- [ ] Implement rate limiting on RPC endpoints
- [ ] Log RPC operations for audit trail
- [ ] Never expose sensitive data in responses (passwords, tokens, etc.)
- [ ] Use CSRF tokens for state-changing operations
- [ ] Validate payload size limits

---

## Common Pitfalls & Solutions

| Problem | Solution |
|---------|----------|
| Exposing entity directly | Map entity to DTO in handler |
| Validation in handler | Use Zod schema + middleware |
| Type `any` in signatures | Use full types from RPC map |
| Mixing HTTP and RPC | Keep RPC responses unwrapped |
| No error standardization | Use error middleware |
| Duplicate handler logic | Extract to service layer |
| Hard to test handlers | Inject dependencies via context |
| Client type safety issues | Generate client code from RPC map |
| Breaking API changes | Version RPC operations |
