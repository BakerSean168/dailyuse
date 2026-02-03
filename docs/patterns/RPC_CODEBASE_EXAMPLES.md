# RPC Protocol - Real Examples from Your Codebase

This document shows real patterns from your workspace with improvements and best practices applied.

---

## Example 1: Authentication RPC Protocol

### Current State in Your Workspace

You have excellent protocol definitions. Here's what you're doing right:

**File**: `packages/contracts/src/modules/authentication/protocol/auth-rpc-map.ts`
```typescript
export type AuthRpcMap = {
  'auth:register-email': [RegisterByEmailReq, RegisterByEmailRes];
  'auth:login-email': [LoginByEmailReq, LoginByEmailRes];
  'auth:get-current-user': [GetCurrentUserReq, GetCurrentUserRes];
  // ... more operations
};
```

**✅ BEST PRACTICES YOU'RE FOLLOWING**:
- Clear namespace:operation naming convention
- Separate request and response types
- Fully qualified action names
- Type-safe RPC map definition

### Recommended Improvements

**1. Add Validation Schemas**

```typescript
// packages/contracts/src/modules/authentication/api/login.ts
import { z } from 'zod';

export const LoginByEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().default(false).optional(),
});

export type LoginByEmailReq = z.infer<typeof LoginByEmailSchema>;

export interface LoginByEmailRes {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}
```

**2. Ensure Response DTOs Don't Expose Entities**

```typescript
// ❌ Current (may be exposing too much)
export interface AuthResponseDTO {
  accessToken: string;
  refreshToken?: string;
  identity: AuthIdentityClientDTO;
  session: AuthSessionClientDTO;
}

// ✅ Improved (explicitly document what's included)
export interface LoginRes {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    name: string;
    // Explicitly NOT included:
    // - passwordHash
    // - internalFlags
    // - auditLog
    // - permissions (fetch separately if needed)
  };
  session: {
    id: string;
    expiresAt: string;
    // NOT included:
    // - internal session data
    // - full audit trail
  };
}
```

---

## Example 2: Express Route Implementation

### Current Pattern in Your Workspace

**File**: `apps/api/src/modules/authentication/interface/authentication-login.routes.ts`

```typescript
export function registerLoginRoutes(): Router {
  const router: Router = ExpressRouter();
  
  router.post('/register', deviceInfoMiddleware, async (req, res) => {
    try {
      const { username, email, password, profile } = req.body;
      const result = await AccountApplicationService.register({...});
      return res.json(result); // ⚠️ May return entity directly
    } catch (error) {
      // error handling
    }
  });

  return router;
}
```

### Recommended: RPC Pattern Implementation

```typescript
// File: apps/api/src/modules/authentication/interface/auth-rpc.routes.ts
import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthRpcMap } from '@dailyuse/contracts/authentication/protocol';
import { 
  LoginByEmailSchema,
  RegisterByEmailSchema,
} from '@dailyuse/contracts/authentication/api';
import { RpcRouter } from '@/shared/infrastructure/rpc/rpcRouter';
import {
  AuthenticationApplicationService,
  AccountApplicationService,
} from '@dailyuse/application-server';
import { createLogger } from '@dailyuse/utils';
import { deviceInfoMiddleware } from '@/shared/infrastructure/http/middlewares';

const logger = createLogger('AuthenticationRpcRoutes');

export function registerAuthenticationRpcRoutes(): Router {
  const router = ExpressRouter();
  const rpc = new RpcRouter<AuthRpcMap>();

  // ============ REGISTER ============
  rpc.handle(
    'auth:register-email',
    async (req, ctx) => {
      const accountService = await AccountApplicationService.getInstance();
      
      // Call service (returns domain entity)
      const result = await accountService.register({
        email: req.email,
        password: req.password,
        username: req.username,
        profile: req.profile,
      });

      // ✅ MAP DOMAIN ENTITY TO RESPONSE DTO
      return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        identity: {
          accountUuid: result.user.id,
          username: result.user.username,
          email: result.user.email,
          displayName: result.user.displayName,
          // ❌ DO NOT INCLUDE:
          // - passwordHash
          // - internalFlags
          // - auditLog
        },
        session: {
          sessionId: result.session.id,
          expiresAt: result.session.expiresAt.toISOString(),
        },
      };
    },
    async (req) => {
      // Validation at middleware level
      await RegisterByEmailSchema.parseAsync(req);
    },
  );

  // ============ LOGIN ============
  rpc.handle(
    'auth:login-email',
    async (req, ctx) => {
      const authService = await AuthenticationApplicationService.getInstance();
      
      // Add device info from middleware to context
      const deviceInfo = (ctx.metadata as any)?.deviceInfo;
      
      const result = await authService.loginByEmail(
        req.email,
        req.password,
        req.rememberMe,
        deviceInfo,
      );

      return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        identity: {
          accountUuid: result.user.id,
          username: result.user.username,
          email: result.user.email,
          displayName: result.user.displayName,
        },
        session: {
          sessionId: result.session.id,
          expiresAt: result.session.expiresAt.toISOString(),
        },
      };
    },
    async (req) => {
      await LoginByEmailSchema.parseAsync(req);
    },
  );

  // ============ GET CURRENT USER ============
  rpc.handle(
    'auth:get-current-user',
    async (req, ctx) => {
      if (!ctx.userId) {
        throw new AuthenticationError('Not authenticated');
      }

      const authService = await AuthenticationApplicationService.getInstance();
      const user = await authService.getCurrentUser(ctx.userId);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return {
        accountUuid: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
      };
    },
  );

  // ============ REFRESH TOKEN ============
  rpc.handle(
    'auth:refresh-token',
    async (req, ctx) => {
      if (!ctx.userId) {
        throw new AuthenticationError('Not authenticated');
      }

      const authService = await AuthenticationApplicationService.getInstance();
      const result = await authService.refreshToken(
        req.refreshToken,
        ctx.userId,
      );

      return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      };
    },
    async (req) => {
      if (!req.refreshToken) {
        throw new ValidationError('refreshToken is required');
      }
    },
  );

  // ============ LOGOUT ============
  rpc.handle(
    'auth:logout',
    async (req, ctx) => {
      if (!ctx.userId) {
        throw new AuthenticationError('Not authenticated');
      }

      const authService = await AuthenticationApplicationService.getInstance();
      await authService.logout(ctx.userId);
    },
  );

  // Mount RPC middleware
  router.post(
    '/rpc',
    deviceInfoMiddleware, // ← device info goes into context.metadata
    rpc.middleware(),
  );

  return router;
}
```

### Enhanced RpcRouter with Device Info

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
    this.handlers.set(actionStr, handler);
    if (validator) this.validators.set(actionStr, validator);
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
              message: 'Missing "action" field in request body',
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
              message: `No handler for action: ${action}`,
            },
          });
        }

        // Validation
        const validator = this.validators.get(action);
        if (validator) {
          try {
            await validator(payload);
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Validation failed';
            return res.status(422).json({
              success: false,
              data: null,
              error: {
                code: 'VALIDATION_ERROR',
                message,
              },
            });
          }
        }

        // Build context from request
        const context: RpcContext = {
          userId: req.user?.id,
          accountId: req.user?.accountId,
          metadata: {
            ip: req.ip,
            userAgent: req.get('user-agent'),
            deviceInfo: req.deviceInfo, // ← from deviceInfoMiddleware
            timestamp: new Date().toISOString(),
          },
        };

        // Execute handler
        logger.info(`[RPC] ${action} from ${context.metadata?.ip}`);
        const result = await handler(payload, context);

        return res.json({
          success: true,
          data: result,
          error: null,
        });
      } catch (error) {
        logger.error(`[RPC] ${req.body?.action}:`, error);

        const statusCode = error instanceof ValidationError ? 422
                         : error instanceof AuthenticationError ? 401
                         : error instanceof AuthorizationError ? 403
                         : error instanceof NotFoundError ? 404
                         : 500;

        return res.status(statusCode).json({
          success: false,
          data: null,
          error: {
            code: error.code || 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    };
  }
}
```

---

## Example 3: TypeScript-Safe Error Classes

```typescript
// File: apps/api/src/shared/infrastructure/rpc/rpcErrors.ts

export class RpcError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = 'RpcError';
  }
}

export class ValidationError extends RpcError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 422);
  }
}

export class AuthenticationError extends RpcError {
  constructor(message = 'Not authenticated') {
    super('AUTHENTICATION_ERROR', message, 401);
  }
}

export class AuthorizationError extends RpcError {
  constructor(message = 'Access denied') {
    super('AUTHORIZATION_ERROR', message, 403);
  }
}

export class NotFoundError extends RpcError {
  constructor(message = 'Resource not found') {
    super('NOT_FOUND', message, 404);
  }
}

export class ConflictError extends RpcError {
  constructor(message: string) {
    super('CONFLICT', message, 409);
  }
}
```

---

## Example 4: Mapping Domain Entity to DTO

### Pattern: Entity Mapper Helper

```typescript
// File: apps/api/src/shared/infrastructure/mappers/authMapper.ts
import type { User } from '@dailyuse/domain-server';
import type { Account } from '@dailyuse/domain-server';
import type {
  AuthIdentityClientDTO,
  LoginRes,
} from '@dailyuse/contracts/authentication';

/**
 * Maps Account domain entity to API identity DTO
 * 
 * Filters out:
 * - passwordHash
 * - internal flags
 * - audit trail
 */
export function mapAccountToIdentityDto(account: Account): AuthIdentityClientDTO {
  return {
    accountUuid: account.id,
    username: account.username,
    email: account.email,
    displayName: account.displayName,
    avatar: account.avatarUrl,
    // ❌ NEVER INCLUDE:
    // - passwordHash: internal security data
    // - internalFlags: implementation details
    // - createdAt, updatedAt: not needed in identity
    // - roles: fetch separately if needed
  };
}

/**
 * Maps auth service result to login response DTO
 */
export function mapAuthResultToLoginRes(result: {
  accessToken: string;
  refreshToken?: string;
  account: Account;
  session: any;
}): LoginRes {
  return {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    identity: mapAccountToIdentityDto(result.account),
    session: {
      id: result.session.id,
      expiresAt: result.session.expiresAt.toISOString(),
    },
  };
}
```

### Usage in Handler

```typescript
rpc.handle(
  'auth:login-email',
  async (req, ctx) => {
    const authService = await AuthenticationApplicationService.getInstance();
    const result = await authService.loginByEmail(req.email, req.password);
    
    // ✅ Use mapper to ensure proper DTO structure
    return mapAuthResultToLoginRes(result);
  },
);
```

---

## Example 5: Testing RPC Handlers

### Unit Test Pattern

```typescript
// File: apps/api/src/modules/authentication/interface/__tests__/auth-rpc.routes.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AuthRpcMap } from '@dailyuse/contracts/authentication';
import {
  RegisterByEmailSchema,
  LoginByEmailSchema,
} from '@dailyuse/contracts/authentication/api';
import { RpcRouter } from '@/shared/infrastructure/rpc/rpcRouter';
import {
  AuthenticationApplicationService,
  AccountApplicationService,
} from '@dailyuse/application-server';

describe('AuthenticationRpcRoutes', () => {
  let rpc: RpcRouter<AuthRpcMap>;
  let mockAuthService: any;
  let mockAccountService: any;

  beforeEach(() => {
    rpc = new RpcRouter<AuthRpcMap>();
    
    mockAuthService = {
      loginByEmail: vi.fn().mockResolvedValue({
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        account: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          displayName: 'Test User',
          avatarUrl: null,
          passwordHash: 'hashed', // Should NOT be in response
        },
        session: {
          id: 'session-1',
          expiresAt: new Date(Date.now() + 3600000),
        },
      }),
    };

    mockAccountService = {
      register: vi.fn().mockResolvedValue({
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        account: { /* ... */ },
        session: { /* ... */ },
      }),
    };
  });

  describe('auth:login-email', () => {
    it('should return access token for valid credentials', async () => {
      rpc.handle('auth:login-email', async (req) => {
        const result = await mockAuthService.loginByEmail(
          req.email,
          req.password,
        );
        return {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          identity: {
            accountUuid: result.account.id,
            username: result.account.username,
            email: result.account.email,
            displayName: result.account.displayName,
            // NOT including passwordHash
          },
          session: {
            id: result.session.id,
            expiresAt: result.session.expiresAt.toISOString(),
          },
        };
      });

      const handler = rpc.middleware();
      const req = {
        body: {
          action: 'auth:login-email',
          payload: {
            email: 'test@example.com',
            password: 'password123',
          },
        },
        user: undefined,
        ip: '127.0.0.1',
        get: vi.fn(),
      };
      
      const res = {
        json: vi.fn().mockReturnThis(),
        status: vi.fn().mockReturnThis(),
      };

      await handler(req as any, res as any, vi.fn());

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            accessToken: 'test-token',
            identity: expect.objectContaining({
              accountUuid: '1',
              username: 'testuser',
            }),
          }),
        }),
      );

      // Verify sensitive data is NOT in response
      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.identity.passwordHash).toBeUndefined();
    });

    it('should return 422 for invalid email format', async () => {
      rpc.handle(
        'auth:login-email',
        async (req) => mockAuthService.loginByEmail(req.email, req.password),
        async (req) => LoginByEmailSchema.parseAsync(req),
      );

      const handler = rpc.middleware();
      const req = {
        body: {
          action: 'auth:login-email',
          payload: {
            email: 'invalid-email',
            password: 'password123',
          },
        },
        ip: '127.0.0.1',
        get: vi.fn(),
      };
      
      const res = {
        json: vi.fn().mockReturnThis(),
        status: vi.fn().mockReturnThis(),
      };

      await handler(req as any, res as any, vi.fn());

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
          }),
        }),
      );
    });
  });
});
```

---

## Example 6: App Integration

```typescript
// File: apps/api/src/app.ts (excerpt)
import { registerAuthenticationRpcRoutes } from './modules/authentication/interface';
import { deviceInfoMiddleware } from './shared/infrastructure/http/middlewares';

export const createApp = (deps: AppDependencies): Express => {
  const app: Express = express();

  // Global middlewares
  app.use(helmet());
  app.use(express.json());
  app.use(cookieParser());
  app.use(compression());
  app.use(deviceInfoMiddleware); // ← Populates req.deviceInfo

  // Setup CORS and auth middleware
  app.use(cors({...}));

  // ============ RPC ROUTES ============
  app.use('/api/auth', registerAuthenticationRpcRoutes());
  // app.use('/api/user', registerUserRpcRoutes());
  // app.use('/api/task', registerTaskRpcRoutes());

  // ============ HEALTH & INFO ============
  app.use(infrastructureRouter); // /healthz, /readyz, /info, etc.

  return app;
};
```

---

## Example 7: Response Builder Pattern (Your Current Approach)

Your current code uses `createResponseBuilder()`. Here's how to adapt it for RPC:

```typescript
// File: apps/api/src/shared/infrastructure/rpc/rpcResponseBuilder.ts
import type { Response } from 'express';

export interface RpcErrorObject {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface RpcResponsePayload<T> {
  success: boolean;
  data: T | null;
  error: RpcErrorObject | null;
}

export class RpcResponseBuilder {
  constructor(private res: Response) {}

  success<T>(data: T, statusCode = 200): Response {
    return this.res.status(statusCode).json({
      success: true,
      data,
      error: null,
    });
  }

  error(
    code: string,
    message: string,
    statusCode = 500,
    details?: Record<string, any>,
  ): Response {
    return this.res.status(statusCode).json({
      success: false,
      data: null,
      error: {
        code,
        message,
        ...(details && { details }),
      },
    });
  }

  validationError(message: string, details?: Record<string, any>): Response {
    return this.error('VALIDATION_ERROR', message, 422, details);
  }

  authenticationError(message = 'Not authenticated'): Response {
    return this.error('AUTHENTICATION_ERROR', message, 401);
  }

  authorizationError(message = 'Access denied'): Response {
    return this.error('AUTHORIZATION_ERROR', message, 403);
  }

  notFound(message = 'Resource not found'): Response {
    return this.error('NOT_FOUND', message, 404);
  }
}

export function createRpcResponseBuilder(res: Response): RpcResponseBuilder {
  return new RpcResponseBuilder(res);
}
```

---

## Integration with Your Existing Patterns

Your workspace already has excellent structures. Here's how to integrate RPC:

```
Current Structure → Enhanced with RPC

modules/auth/
├── interface/
│   ├── authentication.routes.ts (HTTP endpoints)
│   ├── authentication-rpc.routes.ts (✨ NEW - RPC handlers)
│   └── index.ts (exports both)
│
└── ... (application service, domain layer unchanged)

packages/contracts/
├── modules/auth/
│   ├── api/ (✅ ALREADY HAVE THIS)
│   ├── protocol/ (✅ ALREADY HAVE THIS)
│   ├── dtos/ (✅ ALREADY HAVE THIS)
│   └── entities/ (internal only, never exported)
```

**Key Insight**: You already have the right structure! Just need to:
1. Ensure RPC maps only use DTOs
2. Add explicit entity-to-DTO mapping in handlers
3. Add Zod validation schemas
4. Create RpcRouter infrastructure

---

## Migration Path for Your Project

### Phase 1 (This Week): Foundation
- [ ] Create RpcRouter class in infrastructure
- [ ] Define error types
- [ ] Add one RPC operation (auth:login)
- [ ] Test thoroughly

### Phase 2 (Next Week): Expand
- [ ] Add more auth operations
- [ ] Add to user, task, or reminder modules
- [ ] Document patterns
- [ ] Train team

### Phase 3 (Ongoing): Optimize
- [ ] Monitor performance
- [ ] Refine entity-to-DTO mapping
- [ ] Add client-side examples
- [ ] Consider OpenAPI export for REST compatibility

---

## Summary: Your Action Plan

1. **Copy RpcRouter template** from RPC_IMPLEMENTATION_TOOLKIT.md to your infrastructure
2. **Create error classes** with the code above
3. **Add Zod schemas** to your existing DTOs
4. **Implement one RPC handler** (auth:login) using the pattern above
5. **Wire into app.ts** and test
6. **Expand to other modules** following the same pattern

Your code is already well-organized for RPC adoption! The main gaps are:
- Explicit RpcRouter implementation
- Entity-to-DTO mapping helpers
- Zod validation schemas
- Error standardization

All of these are provided in the toolkit documents.
