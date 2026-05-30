/**
 * @dailyuse/authentication
 *
 * 认证模块 - 身份认证与会话管理
 * Authentication module — identity authentication and session management.
 *
 * 【分层架构】
 *
 * ```
 * ┌─────────────────────────────────────────────────────────┐
 * │  contracts (契约层)                                      │
 * │  - 类型定义（interface/type）                            │
 * │  - DTO（Client/Server/Persistence）                     │
 * │  - 领域事件                                              │
 * │  - API Schema (Zod)                                     │
 * ├─────────────────────────────────────────────────────────┤
 * │  domain-shared (共享领域层)                              │
 * │  - IPasswordHasher                                      │
 * │  - 前后端可共享的业务规则                                │
 * ├─────────────────────────────────────────────────────────┤
 * │  domain-server (服务端领域层)                            │
 * │  - 聚合根（AuthIdentity, AuthSession）                  │
 * │  - 仓储接口（IAuthIdentityRepository, etc.）            │
 * ├─────────────────────────────────────────────────────────┤
 * │  application-server (服务端应用层)                       │
 * │  - 用例服务（Login, Register, Logout, etc.）            │
 * ├─────────────────────────────────────────────────────────┤
 * │  infrastructure-server (服务端基础设施层)                │
 * │  - Prisma / PowerSync 仓储实现                          │
 * │  - 组合根 createAuthenticationModule()                  │
 * └─────────────────────────────────────────────────────────┘
 * ```
 *
 * 【使用示例】
 *
 * ```typescript
 * // 1. 导入契约层类型
 * import type { AuthIdentityServerDTO } from '@dailyuse/contracts/authentication';
 *
 * // 2. 导入聚合根
 * import { AuthIdentity, AuthSession } from '@dailyuse/authentication/domain-server';
 *
 * // 3. 使用组合根
 * import { createAuthenticationModule } from '@dailyuse/authentication/infrastructure-server';
 * const module = createAuthenticationModule({ identityRepository, sessionRepository, passwordHasher, tokenProvider });
 * const result = await module.api.login(data, cx);
 *
 * // 4. 注册 API 模块 (in apps/api)
 * import { AuthenticationApiModule } from '@dailyuse/authentication/api';
 * bootstrapper.register(AuthenticationApiModule);
 * ```
 */

// ================= Contracts Layer (契约层) =================
// Type definitions, DTOs, Events, API Schemas
export * from '@dailyuse/contracts/authentication';

// ================= Domain Layer (领域层) =================
// Domain-Server: Aggregates, entities, repositories (server-side)
export { AuthIdentity } from './domain-server';
export { AuthSession } from './domain-server';
export type { IAuthIdentityRepository, IAuthSessionRepository } from './domain-server';

// ================= Application Layer (应用层) =================
// Application-Server: Use cases (server-side)
// Application-Client: Client services, API client ports
export * from './application-server';
export * from './application-client';

// ================= Infrastructure Layer (基础设施层) =================
// Infrastructure-Server: Repositories, persistence, composition root (server-side)
// Infrastructure-Client: HTTP/IPC adapters (client-side)
export { createAuthenticationModule, createAuthenticationPowerSyncModule, type AuthenticationApplicationPort, type AuthenticationModuleDependencies, type AuthenticationModuleInstance, type AuthenticationModuleRuntimeContribution, type AuthenticationModuleUseCases } from './infrastructure-server';

export * from './infrastructure-client';
