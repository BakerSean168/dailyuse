/**
 * Application Client Layer - Barrel Export
 * 应用客户端层 - 统一导出
 */

// ===== Port Interfaces =====
export type { IRuleApiClient } from '../contracts/api/rule-api-client.port';

export * from './services';
export { createGovernanceServiceFromHttpClient } from './governance-http-service-factory';
