# RPC Protocol Best Practices for Express.js

## 📋 Table of Contents
1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [RPC Protocol Structure](#rpc-protocol-structure)
4. [Type Safety Layers](#type-safety-layers)
5. [Middleware Patterns](#middleware-patterns)
6. [Code Examples](#code-examples)
7. [Anti-patterns](#anti-patterns)
8. [Decision Matrix](#decision-matrix)

---

## Overview

### What is an RPC Protocol?
**Remote Procedure Call (RPC)** is a protocol that allows a client to request execution of a procedure on a server. In Express.js, this typically means:

1. **Request**: Client sends structured data with action type and parameters
2. **Processing**: Server executes handler and applies business logic
3. **Response**: Server returns structured result with typed data

### Why RPC in Express.js?
- **Explicit contracts**: Clear request/response boundaries
- **Type-safe**: Full TypeScript support with auto-completion
- **Consistent API**: Unified request/response format across all handlers
- **Easier testing**: Predictable input/output shapes
- **Desktop compatibility**: Electron/Tauri can use the same protocol

### NestJS vs Express-Native RPC
Express doesn't have built-in RPC support like NestJS does through decorators. Instead, you must:

1. Define explicit RPC maps (request/response pairs)
2. Create middleware for validation and transformation
3. Implement routing based on action types
4. Maintain clear boundaries between DTOs and domain objects

---

## Core Concepts

### 1. RPC Map (Protocol Definition)
An RPC Map is a type-safe registry that defines all available operations:

```typescript
// ✅ CORRECT: RPC Map definition
export type AuthRpcMap = {
  'auth:login': [LoginReq, LoginRes];
  'auth:register': [RegisterReq, RegisterRes];
  'auth:logout': [void, void];
};
```

**Key Points**:
- Tuple format: `[RequestType, ResponseType]`
- Fully qualified action names (namespace:action)
- Both `RequestType` and `ResponseType` must be DTOs, **never domain entities**

### 2. DTO Layers (Separation of Concerns)
You must maintain distinct types across different layers:

```typescript
// Layer 1: Domain Entity (Internal)
class UserEntity {
  id: string;
  email: string;
  passwordHash: string;
  internalFlag: boolean; // Should NOT be exposed
  createdAt: Date;
}

// Layer 2: Request DTO (From Client)
interface LoginReq {
  email: string;
  password: string; // Plain password, never stored
}

// Layer 3: Response DTO (To Client)
interface LoginRes {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

// ❌ WRONG: Exposing domain entity directly
type BadLoginRes = UserEntity;

// ✅ CORRECT: Always map to DTO
type GoodLoginRes = Omit<UserEntity, 'passwordHash' | 'internalFlag'>;
```

### 3. Response Type Definition (Protocol-Agnostic)
The RPC protocol response differs from HTTP responses:

```typescript
// RPC Response Format (used in RpcMap)
interface RpcResponsePayload<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

// Usage in RPC Map:
export type AuthRpcMap = {
  'auth:login': [LoginReq, LoginRes]; // LoginRes is unwrapped
};

// When sent over HTTP/IPC, it becomes:
// { success: true, data: <LoginRes>, error: null }
```

---

## RPC Protocol Structure

### Pattern 1: Dedicated RPC Router (Express-Native)

```typescript
// ============================================================================
// 1. Protocol Definition (packages/contracts/src/modules/auth/protocol.ts)
// ============================================================================

import type { LoginReq, LoginRes } from './api';

export type AuthRpcMap = {
  'auth:login': [LoginReq, LoginRes];
  'auth:register': [RegisterReq, RegisterRes];
};

// ============================================================================
// 2. RPC Request Handler Type (packages/contracts/src/protocols.ts)
// ============================================================================

type RpcHandler<TReq, TRes> = (req: TReq, context: RpcContext) => Promise<TRes> | TRes;

interface RpcContext {
  userId?: string;
  accountId?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// 3. RPC Router Factory (apps/api/src/shared/infrastructure/rpc/rpcRouter.ts)
// ============================================================================

import type { Express } from 'express';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('RpcRouter');

type RpcMap = Record<string, [any, any]>;

export class RpcRouter<TRpcMap extends RpcMap> {
  private handlers = new Map<string, RpcHandler<any, any>>();
  private validators = new Map<string, (data: any) => Promise<void>>();

  /**
   * Register a single RPC handler
   */
  handle<K extends keyof TRpcMap>(
    action: K,
    handler: RpcHandler<TRpcMap[K][0], TRpcMap[K][1]>,
    validator?: (req: TRpcMap[K][0]) => Promise<void>,
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

  /**
   * Get Express middleware for handling RPC requests
   */
  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const action = req.body?.action as string;
      const payload = req.body?.payload;

      if (!action) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_RPC_REQUEST', message: 'Missing action' },
        });
      }

      const handler = this.handlers.get(action);
      const validator = this.validators.get(action);

      if (!handler) {
        return res.status(404).json({
          success: false,
          error: { code: 'RPC_ACTION_NOT_FOUND', message: `No handler for ${action}` },
        });
      }

      try {
        // Validate request if validator provided
        if (validator) {
          await validator(payload);
        }

        // Execute handler
        const result = await handler(payload, {
          userId: req.user?.id,
          accountId: req.user?.accountId,
        });

        return res.json({
          success: true,
          data: result,
          error: null,
        });
      } catch (error) {
        logger.error(`RPC Error [${action}]:`, error);
        return res.status(500).json({
          success: false,
          data: null,
          error: {
            code: error instanceof ValidationError ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    };
  }
}

// ============================================================================
// 4. Usage in Route Handler (apps/api/src/modules/auth/interface)
// ============================================================================

import { Router } from 'express';
import { RpcRouter } from '@/shared/infrastructure/rpc/rpcRouter';
import type { AuthRpcMap } from '@dailyuse/contracts/auth/protocol';

export function registerAuthRpcRoutes(): Router {
  const router = Router();
  const rpc = new RpcRouter<AuthRpcMap>();

  // Register handlers with validation
  rpc.handle(
    'auth:login',
    async (req, ctx) => {
      const service = await AuthService.getInstance();
      const result = await service.login(req.email, req.password);
      
      // ✅ Map domain entity to DTO
      return {
        accessToken: result.token,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
      };
    },
    async (req) => {
      // Validation middleware
      if (!req.email || !req.password) {
        throw new ValidationError('email and password required');
      }
    },
  );

  rpc.handle('auth:register', async (req) => {
    const service = await AuthService.getInstance();
    return service.register(req);
  });

  // Mount RPC middleware
  router.post('/rpc', authMiddleware, rpc.middleware());

  return router;
}
```

---

## Type Safety Layers

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  CLIENT (Browser / Electron / Tauri)                        │
│  Sends: { action: 'auth:login', payload: LoginReq }        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼ HTTP/IPC
┌─────────────────────────────────────────────────────────────┐
│  EXPRESS RPC MIDDLEWARE                                     │
│  1. Parse { action, payload }                              │
│  2. Validate payload against RequestType (Zod/Joi)         │
│  3. Extract context (auth, metadata)                       │
│  4. Call handler(payload, context)                         │
│  5. Wrap response in { success, data, error }              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  RPC HANDLER LAYER                                          │
│  Input: LoginReq (DTO)                                      │
│  Logic: Call application service                           │
│  Output: LoginRes (DTO, NOT UserEntity)                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  APPLICATION SERVICE LAYER                                  │
│  Input: Plain DTOs                                          │
│  Logic: Business logic, transformations                     │
│  Output: Domain entities (internal)                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  DOMAIN / DATABASE LAYER                                    │
│  Works with: UserEntity, internal objects                  │
│  Never exposed: passwordHash, internal flags               │
└─────────────────────────────────────────────────────────────┘
```

### Type Hierarchy

```typescript
// ============================================================================
// LEVEL 1: Domain Entities (Internal, DO NOT EXPORT)
// ============================================================================
namespace Domain {
  export class User {
    id: string;
    email: string;
    passwordHash: string; // ❌ NEVER expose
    internalFlags: Map<string, any>; // ❌ NEVER expose
    auditLog: AuditEntry[]; // ❌ NEVER expose
  }
}

// ============================================================================
// LEVEL 2: API DTOs (Request/Response contracts)
// ============================================================================
namespace API {
  // Request DTO
  export interface LoginReq {
    email: string;
    password: string;
  }

  // Response DTO
  export interface LoginRes {
    accessToken: string;
    refreshToken?: string;
    user: {
      id: string;
      email: string;
      name: string;
    };
  }
}

// ============================================================================
// LEVEL 3: RPC Map (Protocol definition using DTOs)
// ============================================================================
export type AuthRpcMap = {
  'auth:login': [API.LoginReq, API.LoginRes]; // ✅ Only DTOs here
};

// ============================================================================
// LEVEL 4: Handler Implementation (Maps domain → DTO)
// ============================================================================
async function handleAuthLogin(req: API.LoginReq, ctx: RpcContext): Promise<API.LoginRes> {
  // Step 1: Call application service (works with domain)
  const result = await authService.login(req.email, req.password);
  // result.user is Domain.User

  // Step 2: Map domain entity to response DTO
  return {
    accessToken: result.token,
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      // ✅ Do NOT include: passwordHash, internalFlags, auditLog
    },
  };
}
```

---

## Middleware Patterns

### Pattern 1: Validation Middleware

```typescript
import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

/**
 * Validates RPC request payload against Zod schema
 */
export function rpcValidationMiddleware(schemas: Record<string, z.ZodSchema>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const action = req.body?.action as string;
    const payload = req.body?.payload;

    const schema = schemas[action];
    if (!schema) {
      return next(); // No schema, skip validation
    }

    try {
      const validated = await schema.parseAsync(payload);
      req.body.payload = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        });
      }
      next(error);
    }
  };
}

// Usage
const schemas: Record<string, z.ZodSchema> = {
  'auth:login': z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
  'auth:register': z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string(),
  }),
};

router.use(rpcValidationMiddleware(schemas));
```

### Pattern 2: Context Extraction Middleware

```typescript
/**
 * Extracts RPC context from request (auth, metadata, etc.)
 */
export function rpcContextMiddleware(req: Request, res: Response, next: NextFunction) {
  const context: RpcContext = {
    userId: req.user?.id,
    accountId: req.user?.accountId,
    metadata: {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date(),
    },
  };

  res.locals.rpcContext = context;
  next();
}

// Usage
interface RpcContext {
  userId?: string;
  accountId?: string;
  metadata?: Record<string, any>;
}

declare global {
  namespace Express {
    interface Locals {
      rpcContext: RpcContext;
    }
  }
}
```

### Pattern 3: Response Wrapping Middleware

```typescript
/**
 * Wraps all RPC responses in standard format
 */
export function rpcResponseMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json;

  res.json = function (body: any) {
    // If already wrapped, return as-is
    if (body?.success !== undefined) {
      return originalJson.call(this, body);
    }

    // Wrap successful response
    const wrapped = {
      success: true,
      data: body,
      error: null,
    };

    return originalJson.call(this, wrapped);
  };

  next();
}
```

### Pattern 4: Error Handling Middleware

```typescript
/**
 * Centralized RPC error handling
 */
export function rpcErrorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  const logger = createLogger('RpcErrorHandler');
  const action = req.body?.action;

  logger.error(`RPC Error [${action}]:`, err);

  // Map error types to RPC error codes
  let errorCode = 'INTERNAL_ERROR';
  let statusCode = 500;

  if (err instanceof ValidationError) {
    errorCode = 'VALIDATION_ERROR';
    statusCode = 422;
  } else if (err instanceof AuthenticationError) {
    errorCode = 'AUTHENTICATION_ERROR';
    statusCode = 401;
  } else if (err instanceof AuthorizationError) {
    errorCode = 'AUTHORIZATION_ERROR';
    statusCode = 403;
  } else if (err instanceof NotFoundError) {
    errorCode = 'NOT_FOUND';
    statusCode = 404;
  }

  res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      code: errorCode,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}
```

---

## Code Examples

### ✅ CORRECT Pattern

```typescript
/**
 * File: packages/contracts/src/modules/auth/api/login.ts
 * Defines request and response DTOs using Zod
 */
import { z } from 'zod';

export const LoginReqSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password too short'),
});

export type LoginReq = z.infer<typeof LoginReqSchema>;

export interface LoginRes {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

// ---

/**
 * File: packages/contracts/src/modules/auth/protocol/auth-rpc-map.ts
 * Defines RPC map using DTOs
 */
import type { LoginReq, LoginRes } from '../api';

export type AuthRpcMap = {
  'auth:login': [LoginReq, LoginRes];
  'auth:register': [RegisterReq, RegisterRes];
};

// ---

/**
 * File: apps/api/src/modules/auth/interface/auth-rpc.routes.ts
 * Implements RPC handlers with proper DTO mapping
 */
import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthRpcMap } from '@dailyuse/contracts/auth';
import { RpcRouter } from '@/shared/infrastructure/rpc/rpcRouter';
import { AuthService } from '@dailyuse/application-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AuthRpcRoutes');

export function registerAuthRpcRoutes(): Router {
  const router = ExpressRouter();
  const rpc = new RpcRouter<AuthRpcMap>();

  // ✅ Handler properly maps domain entity to DTO
  rpc.handle(
    'auth:login',
    async (req: LoginReq): Promise<LoginRes> => {
      const authService = await AuthService.getInstance();
      
      // Call service (returns domain entity)
      const result = await authService.login(req.email, req.password);
      
      // ✅ CORRECT: Map domain entity to response DTO
      return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: {
          id: result.user.id,           // ✅ Include only safe fields
          email: result.user.email,
          name: result.user.fullName,
          // ❌ Do NOT include: passwordHash, internalFlags, etc.
        },
      };
    },
  );

  router.post('/rpc', rpc.middleware());
  return router;
}
```

### ❌ INCORRECT Patterns

```typescript
// ============================================================================
// ANTI-PATTERN 1: Exposing domain entity directly in RPC response
// ============================================================================

// ❌ WRONG: User entity directly as response type
export type BadLoginRes = User; // User has passwordHash, internalFlags!

async function badLoginHandler(req: LoginReq): Promise<BadLoginRes> {
  const user = await userService.findByEmail(req.email);
  // ❌ Returns user entity directly with all fields exposed
  return user; // passwordHash exposed! 🚨
}

// ✅ CORRECT: Map to DTO
async function goodLoginHandler(req: LoginReq): Promise<LoginRes> {
  const user = await userService.findByEmail(req.email);
  // ✅ Only expose safe fields
  return {
    accessToken: user.generateToken(),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
}

// ============================================================================
// ANTI-PATTERN 2: Using ResponseType instead of API response type in RPC map
// ============================================================================

// ❌ WRONG: RPC map uses HTTP wrapper type
type BadRpcMap = {
  'auth:login': [LoginReq, HttpResponse<LoginRes>]; // Wraps in HTTP response!
};

// ✅ CORRECT: RPC map uses unwrapped DTO
type GoodRpcMap = {
  'auth:login': [LoginReq, LoginRes]; // Clean, unwrapped
};

// The protocol middleware handles wrapping automatically:
// {
//   success: true,
//   data: <LoginRes>,
//   error: null
// }

// ============================================================================
// ANTI-PATTERN 3: Request DTOs with same structure as domain entities
// ============================================================================

// ❌ WRONG: Request DTO accepts domain-specific fields
interface BadRegisterReq {
  email: string;
  password: string;
  accountId: string; // ❌ Client shouldn't set this
  createdAt: Date;   // ❌ Server generates this
}

// ✅ CORRECT: Request DTO only has client-provided fields
interface GoodRegisterReq {
  email: string;
  password: string;
  name: string;
  // accountId and createdAt are generated server-side
}

// ============================================================================
// ANTI-PATTERN 4: Mixing validation logic in handler vs middleware
// ============================================================================

// ❌ WRONG: Validation scattered in handler
async function badHandler(req: LoginReq) {
  if (!req.email) throw new Error('email required');
  if (!req.password) throw new Error('password required');
  if (req.password.length < 8) throw new Error('password too short');
  // ... business logic mixed with validation
}

// ✅ CORRECT: Validation in schema, logic in handler
export const LoginReqSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

async function goodHandler(req: LoginReq) {
  // req is already validated
  // Focus only on business logic
  const user = await authService.login(req.email, req.password);
  return mapToDto(user);
}

// ============================================================================
// ANTI-PATTERN 5: Missing type safety in handler signature
// ============================================================================

// ❌ WRONG: Handler uses generic any types
async function badHandler(req: any, ctx: any): Promise<any> {
  // ❌ No type checking, no IDE support
  return await someService.handleLogin(req);
}

// ✅ CORRECT: Fully typed handler
async function goodHandler(
  req: LoginReq,
  ctx: RpcContext,
): Promise<LoginRes> {
  // ✅ Full type safety, IDE auto-completion
  const service = await AuthService.getInstance();
  return service.login(req.email, req.password);
}

// ============================================================================
// ANTI-PATTERN 6: Changing RPC map types without versioning
// ============================================================================

// ❌ WRONG: Breaking change in RPC map
// Old code expects: 'auth:login': [LoginReq, LoginRes]
// New code changes to: 'auth:login': [LoginReq, LoginRes & { profile: Profile }]
// ❌ Old clients break!

// ✅ CORRECT: Version your RPC operations
export type AuthRpcMapV1 = {
  'auth:login': [LoginReq, LoginRes];
};

export type AuthRpcMapV2 = {
  'auth:login': [LoginReq, LoginResV2]; // Extended response
  'auth:get-profile': [void, Profile]; // New operation
};

// Or create separate endpoints:
export type AuthRpcMap = {
  'auth:login-v1': [LoginReq, LoginRes];
  'auth:login-v2': [LoginReq, LoginResV2];
};
```

---

## Anti-patterns

### 1. ❌ Direct Entity Export

```typescript
// ❌ WRONG
export type UserResponse = User;

// ✅ CORRECT
export interface UserResponse {
  id: string;
  email: string;
  name: string;
}
```

### 2. ❌ Mixing HTTP and RPC Response Types

```typescript
// ❌ WRONG
type LoginRpcResponse = {
  statusCode: number;
  data: LoginRes;
  message: string;
};

// ✅ CORRECT
type LoginRes = {
  accessToken: string;
  user: UserDTO;
};
// HTTP wrapping handled by middleware
```

### 3. ❌ Including Server Metadata in Response DTO

```typescript
// ❌ WRONG
interface UserDTO {
  id: string;
  email: string;
  _internalId: string;  // ❌ Exposes internal implementation
  _createdBy: string;   // ❌ Leaks server info
}

// ✅ CORRECT
interface UserDTO {
  id: string;
  email: string;
  name: string;
}
```

### 4. ❌ Validation Only in Service Layer

```typescript
// ❌ WRONG
async function handleLogin(req: any) {
  // Validation happens in service
  try {
    const result = await service.login(req);
  } catch (e) {
    // Hard to standardize error response
  }
}

// ✅ CORRECT
async function handleLogin(req: LoginReq) {
  // req already validated by Zod schema
  // Service only does business logic
  const result = await service.login(req.email, req.password);
  return mapToDto(result);
}
```

### 5. ❌ Request DTO with Generated Fields

```typescript
// ❌ WRONG
interface RegisterReq {
  email: string;
  password: string;
  id: string;      // ❌ Client shouldn't provide
  createdAt: Date; // ❌ Server generates
  accountId: string; // ❌ Derived from context
}

// ✅ CORRECT
interface RegisterReq {
  email: string;
  password: string;
  name: string;
}

// Server generates id, createdAt, accountId from context
```

---

## Decision Matrix

### When to use RPC in Express?

| Scenario | Use RPC? | Why |
|----------|----------|-----|
| Building desktop app (Electron/Tauri) with shared backend | ✅ Yes | Single protocol across platforms |
| Building mobile app with Express backend | ⚠️ Maybe | REST might be simpler, but RPC works |
| Building web SPA with Express backend | ⚠️ Maybe | REST more conventional, but RPC cleaner |
| WebSocket real-time protocol | ✅ Yes | RPC handles bidirectional well |
| Public REST API | ❌ No | REST/OpenAPI is industry standard |
| Microservice communication | ✅ Yes | RPC is ideal for internal APIs |

### Type Safety Decisions

| Decision | RPC Approach | REST Approach |
|----------|-------------|---------------|
| **Request shape** | Single RpcMap type | OpenAPI schema per endpoint |
| **Response shape** | ResponseType DTO | StatusCode determines type |
| **Validation** | Zod/Joi + middleware | Decorators or route-level |
| **Error handling** | Centralized RPC error | Per-route error handlers |
| **Type generation** | From RpcMap | From OpenAPI/Swagger |

### DTO vs Entity Rules

| Context | Use DTO? | Use Entity? |
|---------|----------|------------|
| Request payload schema | ✅ DTO | ❌ No entity |
| Response payload schema | ✅ DTO | ❌ No entity |
| Database queries | ❌ No DTO | ✅ Entity/ORM |
| Domain models | ❌ No DTO | ✅ Entity |
| API responses | ✅ DTO | ❌ No entity |
| Internal function params | ⚠️ Either | ⚠️ Either |

---

## Complete Implementation Guide

### Step 1: Define Contracts

```typescript
// packages/contracts/src/modules/auth/api/login.ts
import { z } from 'zod';

export const LoginReqSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginReq = z.infer<typeof LoginReqSchema>;

export interface LoginRes {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}
```

### Step 2: Define RPC Map

```typescript
// packages/contracts/src/modules/auth/protocol/auth-rpc-map.ts
import type { LoginReq, LoginRes } from '../api';

export type AuthRpcMap = {
  'auth:login': [LoginReq, LoginRes];
};
```

### Step 3: Create RPC Router

```typescript
// apps/api/src/shared/infrastructure/rpc/rpcRouter.ts
// (See "RPC Router Factory" section above)
```

### Step 4: Register Routes

```typescript
// apps/api/src/modules/auth/interface/auth-rpc.routes.ts
import { Router } from 'express';
import type { AuthRpcMap } from '@dailyuse/contracts';
import { RpcRouter } from '@/shared/infrastructure/rpc/rpcRouter';
import { AuthService } from '@dailyuse/application-server';

export function registerAuthRpcRoutes(): Router {
  const router = Router();
  const rpc = new RpcRouter<AuthRpcMap>();

  rpc.handle('auth:login', async (req) => {
    const service = await AuthService.getInstance();
    const result = await service.login(req.email, req.password);
    return {
      accessToken: result.token,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
    };
  });

  router.post('/rpc', rpc.middleware());
  return router;
}
```

### Step 5: Wire in App

```typescript
// apps/api/src/app.ts
import { registerAuthRpcRoutes } from './modules/auth/interface';

app.use('/api/auth', registerAuthRpcRoutes());
```

### Step 6: Use in Client

```typescript
// apps/desktop/src/services/auth.ts
import type { AuthRpcMap } from '@dailyuse/contracts';

async function login(email: string, password: string) {
  const response = await fetch('http://localhost:3000/api/auth/rpc', {
    method: 'POST',
    body: JSON.stringify({
      action: 'auth:login',
      payload: { email, password },
    }),
  });

  const result = await response.json();
  if (result.success) {
    return result.data; // Typed as LoginRes
  }
  throw new Error(result.error.message);
}
```

---

## Summary Checklist

### ✅ Do's

- [ ] Use RPC maps as single source of truth for contracts
- [ ] Separate domain entities from DTOs completely
- [ ] Always map domain entities to response DTOs in handlers
- [ ] Use Zod/Joi for request validation
- [ ] Put validation in middleware, not handlers
- [ ] Keep handlers focused on business logic
- [ ] Type handler functions fully
- [ ] Wrap responses at middleware level
- [ ] Use consistent error codes in RPC errors
- [ ] Document RPC operations in contracts

### ❌ Don'ts

- [ ] Don't export domain entities as response types
- [ ] Don't put validation logic in handlers
- [ ] Don't mix HTTP response types in RPC maps
- [ ] Don't include server-internal fields in DTOs
- [ ] Don't allow clients to set generated fields (id, createdAt, etc.)
- [ ] Don't return raw database entities
- [ ] Don't use `any` types in handler signatures
- [ ] Don't skip validation middleware
- [ ] Don't change RPC map types without versioning
- [ ] Don't expose error stack traces in production

---

## References

- [NestJS RPC Architecture](https://docs.nestjs.com/)
- [Electron IPC Protocol](https://www.electronjs.org/docs/api/ipc-main)
- [Protocol Design Patterns](https://en.wikipedia.org/wiki/Remote_procedure_call)
- Your workspace: `packages/contracts/` for examples
- Your workspace: `apps/api/src/` for Express patterns
