/**
 * Authentication API Module — Barrel Export.
 * 认证 API 模块 — 统一导出。
 *
 * Self-contained API module entry point, exposed to ApiBootstrapper via register().
 */

export { createAuthenticationApiModule } from './module';
export type {
  AuthenticationApiModuleContext,
  AuthenticationApiModuleDef,
  CreateAuthenticationApiModuleOptions,
} from './module';
export { createChallengeIpRateLimitMiddleware, createDefaultAuthChallengeIpRateLimit } from './challenge-ip-rate-limit';
export {
  createRequireEmailVerifiedMiddleware,
  composeAuthWithEmailVerificationGate,
  isEmailVerificationWhitelisted,
} from './require-email-verified.middleware';
