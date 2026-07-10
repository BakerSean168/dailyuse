/**
 * Authentication API Module Definition.
 * 认证 API 模块定义。
 *
 * Implements IApiModule standard interface:
 * 实现 IApiModule 标准接口，内部自治完成：
 *
 * 1. Composition Root (create concrete repos → create module → start)
 *    组合根（创建具体仓储 → 创建模块 → 启动）
 * 2. Route definition and mounting
 *    路由定义与挂载
 *
 * Middleware comes from context.middleware, no dependency on apps/api internals.
 * 中间件来自 context.middleware，不依赖 apps/api 内部实现。
 *
 * JWT secrets are injected through options by the application edge (apps/api),
 * which resolves them from the validated env schema. The module never reads
 * `process.env` directly, so it cannot bypass the schema's length/validation
 * rules or create a second source of truth for auth secrets.
 * JWT 密钥由应用边缘（apps/api）通过 options 注入，来源是已校验的 env schema；
 * 模块本身不直读 process.env，避免绕过校验或产生第二个真值源。
 */

import type { PrismaClient } from '@dailyuse/database';
import type { ServerModuleContext } from '@dailyuse/contracts/shared';
import {
  createAuthenticationPrismaModule,
  JwtTokenProvider,
  type AuthenticationModuleInstance,
} from '../server/infrastructure';
import { registerAuthenticationRoutes } from './routes';
import { createAuthenticationRuntimeContribution } from '../server/infrastructure/runtime';

/**
 * Typed module context for authentication registration.
 * Extends the shared ServerModuleContext with PrismaClient as the db type.
 */
export type AuthenticationApiModuleContext = ServerModuleContext<PrismaClient>;

export interface AuthenticationApiModuleDef {
  readonly name: string;
  register(context: AuthenticationApiModuleContext): void;
  destroy?(): void;
}

/**
 * Options for {@link createAuthenticationApiModule}.
 *
 * `jwtSecret` is required. `refreshSecret` falls back to `jwtSecret` when omitted,
 * matching the env schema semantics (`REFRESH_TOKEN_SECRET` defaults to `JWT_SECRET`).
 */
export interface CreateAuthenticationApiModuleOptions {
  readonly jwtSecret: string;
  readonly refreshSecret?: string;
  readonly accessTokenTtlMs?: number;
  readonly refreshTokenTtlMs?: number;
}

const DEFAULT_ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

let activeAuthenticationModule: AuthenticationModuleInstance | null = null;

export function createAuthenticationApiModule(
  options: CreateAuthenticationApiModuleOptions,
): AuthenticationApiModuleDef {
  const jwtSecret = options.jwtSecret;
  if (!jwtSecret) {
    throw new Error('createAuthenticationApiModule requires a non-empty jwtSecret');
  }
  const refreshSecret = options.refreshSecret || jwtSecret;
  const accessTokenTtlMs = options.accessTokenTtlMs ?? DEFAULT_ACCESS_TOKEN_TTL_MS;
  const refreshTokenTtlMs = options.refreshTokenTtlMs ?? DEFAULT_REFRESH_TOKEN_TTL_MS;

  return {
    name: 'Authentication',

    register(context) {
      const { router, middleware, db } = context;

      // Initialize token provider with injected, pre-validated secrets.
      // 使用注入的、已校验的密钥初始化令牌提供者。
      const tokenProvider = new JwtTokenProvider(
        jwtSecret,
        refreshSecret,
        accessTokenTtlMs,
        refreshTokenTtlMs,
      );

      const authenticationModule = createAuthenticationPrismaModule(db, {
        tokenProvider,
        runtimeContributions: createAuthenticationRuntimeContribution(),
      });
      activeAuthenticationModule = authenticationModule;
      authenticationModule.start();

      // ── 2. Register routes — 注册路由（注入平台中间件）──
      const authRoutes = registerAuthenticationRoutes(
        authenticationModule.api,
        middleware,
        context.openApiRegistry,
      );

      // ── 3. Mount onto API router — 挂载到主路由（模块自决前缀）──
      router.use('/auth', authRoutes);
    },

    destroy() {
      activeAuthenticationModule?.dispose();
      activeAuthenticationModule = null;
    },
  };
}
