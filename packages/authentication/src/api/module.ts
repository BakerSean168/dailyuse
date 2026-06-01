/**
 * Authentication API Module Definition.
 * 认证 API 模块定义。
 *
 * Implements IApiModule standard interface:
 * 实现 IApiModule 标准接口，内部自治完成：
 *
 * 1. Composition Root (create concrete repos → create module → start)
 *    组合根（创建具体仓储 → 创建模块 → 启动）
 * 2. Transport handler creation via createAuthenticationTransportHandlers
 *    通过 createAuthenticationTransportHandlers 创建传输层处理器
 * 3. Route definition and mounting
 *    路由定义与挂载
 *
 * Middleware comes from context.middleware, no dependency on apps/api internals.
 * 中间件来自 context.middleware，不依赖 apps/api 内部实现。
 */

import type { PrismaClient } from '@dailyuse/database';
import type { ServerModuleContext } from '@dailyuse/contracts/shared';
import { eventBus } from '@dailyuse/utils/domain';
import { createEventBusAdapter } from '@dailyuse/patterns';
import {
  createAuthenticationModule,
  PrismaAuthIdentityRepository,
  PrismaAuthSessionRepository,
  Argon2Hasher,
  JwtTokenProvider,
  type AuthenticationModuleInstance,
} from '../infrastructure-server';
import { registerAuthenticationRoutes } from './routes';
import { createAuthenticationTransportHandlers } from './transport-handlers';
import { createAuthenticationRuntimeContribution } from './runtime';

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

let activeAuthenticationModule: AuthenticationModuleInstance | null = null;

export const AuthenticationApiModule: AuthenticationApiModuleDef = {
  name: 'Authentication',

  register(context) {
    const { router, middleware, db } = context;

    // ── 1. Composition Root — 组装依赖（使用共享数据库单例）──
    const prismaClient = db;
    const eventBusAdapter = createEventBusAdapter(eventBus);

    // Initialize token provider with configuration
    // 使用环境变量初始化令牌提供者
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET || jwtSecret;
    const tokenProvider = new JwtTokenProvider(
      jwtSecret,
      refreshSecret,
      15 * 60 * 1000, // 15 minutes for access token
      7 * 24 * 60 * 60 * 1000, // 7 days for refresh token
    );

    const authenticationModule = createAuthenticationModule({
      // The application edge decides which adapter implementation to use.
      // 模块内部只关心端口，不关心数据源来自 Prisma 还是其他实现。
      identityRepository: new PrismaAuthIdentityRepository(prismaClient, eventBusAdapter),
      sessionRepository: new PrismaAuthSessionRepository(prismaClient, eventBusAdapter),
      passwordHasher: new Argon2Hasher(),
      tokenProvider,
      runtimeContributions: createAuthenticationRuntimeContribution(),
    });
    activeAuthenticationModule = authenticationModule;
    authenticationModule.start();

    // ── 2. Create transport handlers — 创建传输层处理器 ──
    const handlers = createAuthenticationTransportHandlers(authenticationModule.api);

    // ── 3. Register routes — 注册路由（注入平台中间件）──
    const authRoutes = registerAuthenticationRoutes(handlers, middleware, context.openApiRegistry);

    // ── 4. Mount onto API router — 挂载到主路由（模块自决前缀）──
    router.use('/auth', authRoutes);
  },

  destroy() {
    activeAuthenticationModule?.dispose();
    activeAuthenticationModule = null;
  },
};
