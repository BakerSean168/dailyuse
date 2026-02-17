/**
 * @dailyuse/authentication
 *
 * 认证模块 - 身份认证与会话管�?
 *
 * 【分层架构�?
 *
 * contracts      �?类型定义、DTO、事件、API Schema
 * domain-shared  �?值对象、IPasswordHasher（前后端共享�?
 * domain-server  �?聚合根（AuthIdentity, AuthSession）、仓储接�?
 * application-server �?用例服务（Login, Register, Logout 等）
 * infrastructure-server �?Prisma 仓储、Argon2 加密、Passport 策略
 * api            �?Express API 模块
 *
 * 【使用示例�?
 *
 * ```typescript
 * // 1. 导入契约
 * import type { AuthIdentityServerDTO } from '@dailyuse/contracts/authentication';
 *
 * // 2. 导入服务端聚合根
 * import { AuthIdentity, AuthSession } from '@dailyuse/authentication/domain-server';
 *
 * // 3. 导入 API 模块（在 apps/api 中）
 * import { AuthenticationApiModule } from '@dailyuse/authentication/api';
 * bootstrapper.register(AuthenticationApiModule);
 * ```
 */

// ================= Contracts Layer =================
export * from '@dailyuse/contracts/authentication';

// ================= Domain Layer =================
export { AuthIdentity } from './domain-server';
export { AuthSession } from './domain-server';
export type { IAuthIdentityRepository, IAuthSessionRepository } from './domain-server';

// ================= Application Layer =================
export * from './application-server';
export * from './application-client';

// ================= Infrastructure Layer =================
export {
  PrismaAuthIdentityRepository,
  PrismaAuthSessionRepository,
  Argon2Hasher,
  AuthenticationContainer,
  AuthenticationModule,
} from './infrastructure-server';
export * from './infrastructure-client';
