/**
 * Authentication API Module — Barrel Export.
 * 认证 API 模块 — 统一导出。
 *
 * Self-contained API module entry point, exposed to ApiBootstrapper via register().
 */

export { AuthenticationApiModule } from './module';
export type { AuthenticationApiModuleContext, AuthenticationApiModuleDef } from './module';

// Runtime contribution factory
export { createAuthenticationRuntimeContribution } from './runtime';
export type { AuthenticationRuntimeContribution } from './runtime';

// Transport handler factory
export { createAuthenticationTransportHandlers } from './transport-handlers';
