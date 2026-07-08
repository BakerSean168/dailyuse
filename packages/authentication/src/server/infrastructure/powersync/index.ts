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
