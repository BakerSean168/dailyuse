/**
 * Authentication Module — PowerSync barrel export.
 * 认证模块 — PowerSync 统一导出。
 *
 * Re-exports PowerSync repositories and the convenience factory for Electron runtime.
 */

export { PowerSyncAuthIdentityRepository } from '../adapters/powersync/auth-identity-powersync.repository';
export { PowerSyncAuthSessionRepository } from '../adapters/powersync/auth-session-powersync.repository';
export { Argon2Hasher } from '../encryptors/argon2-hasher';

// New canonical factory
export {
  createAuthenticationPowerSyncModule,
  type AuthenticationPowerSyncModuleOptions,
} from '../powersync';

// Re-export composition root types for convenience
export {
  createAuthenticationModule,
  type AuthenticationModuleDependencies,
  type AuthenticationModuleInstance,
} from '../authentication.module';

// ============ Legacy (deprecated) ============
/**
 * @deprecated Use `createAuthenticationModule()` instead. 请使用 `createAuthenticationModule()` 代替。
 */
export { AuthenticationModule } from '../authentication.module';

/**
 * @deprecated Legacy DI container — use `createAuthenticationModule()` factory instead.
 * 旧版 DI 容器 — 请使用 `createAuthenticationModule()` 工厂函数代替。
 */
export { AuthenticationContainer } from '../di/authentication-container';

/**
 * @deprecated Legacy repository factory — pass repos directly to `createAuthenticationModule()`.
 * 旧版仓储工厂 — 请直接将仓储传入 `createAuthenticationModule()`。
 */
export { AuthenticationRepositoryFactory } from '../di/authentication-repository.factory';
