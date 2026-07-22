/**
 * Infrastructure Server Layer - Barrel Export.
 * 基础设施服务端层 - 统一导出。
 *
 * Server-side infrastructure:
 * 服务端基础设施：
 * - Repository implementations (Prisma, PowerSync)
 *   仓储实现（Prisma、PowerSync）
 * - Persistence mappers
 *   持久化映射器
 * - Explicit composition root and runtime assembly
 *   显式组合根与运行时组装
 */

// ============ Adapters - Prisma ============
/** @internal Concrete Prisma implementation — use IAuthIdentityRepository interface instead. Prisma 具体实现 — 请使用 IAuthIdentityRepository 接口。 */
export { PrismaAuthIdentityRepository } from './adapters/prisma';
/** @internal Concrete Prisma implementation — use IAuthSessionRepository interface instead. Prisma 具体实现 — 请使用 IAuthSessionRepository 接口。 */
export { PrismaAuthSessionRepository } from './adapters/prisma';

// ============ Adapters - PowerSync ============
/** @internal Concrete PowerSync implementation — use repository interfaces instead. PowerSync 具体实现 — 请使用仓储接口。 */
export {
  PowerSyncAuthIdentityRepository,
  PowerSyncAuthSessionRepository,
} from './adapters/powersync';

// ============ Encryptors ============
export { Argon2Hasher } from './encryptors/argon2-hasher';

// ============ Services ============
export { JwtTokenProvider } from './services/jwt-token-provider';
export { InMemoryVerificationChallengeStore } from './services/in-memory-verification-challenge-store';
export { ConsoleEmailSender } from './services/console-email-sender';
export {
  MockGithubOAuthClient,
  isMockGithubOAuthClientId,
  buildMockGithubAuthorizeUrl,
  MOCK_GITHUB_CODE_PREFIX,
} from './services/mock-github-oauth-client';
export { InMemoryOAuthStateStore } from './services/in-memory-oauth-state-store';
export {
  GithubOAuthClient,
  type GithubOAuthClientConfig,
} from './services/github-oauth-client';

// ============ Strategies ============
export { createJwtStrategy, createLocalStrategy } from './strategies';
export type { JwtStrategyConfig, LocalStrategyConfig } from './strategies';

// ============ Composition Root ============
export {
  createAuthenticationModule,
  createAuthenticationUseCases,
  type AuthenticationModuleDependencies,
  type AuthenticationModuleInstance,
  type AuthenticationModuleRuntimeContribution,
  type AuthenticationModuleUseCases,
  type AuthenticationRuntimeContributionsInput,
} from './authentication.module';
export type { AuthenticationApplicationPort } from '../application';

// ============ PowerSync Convenience Factory ============
export { createAuthenticationPowerSyncModule } from './powersync';
export {
  createAuthenticationPrismaModule,
  type CreateAuthenticationPrismaModuleOptions,
} from './prisma';
export {
  createAuthenticationRuntimeContribution,
  type CreateAuthenticationRuntimeContributionOptions,
} from './runtime';

