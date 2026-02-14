/**
 * Infrastructure Client Layer - Barrel Export
 * 基础设施客户端层 - 统一导出
 *
 * 提供规则模块的 HTTP 和 IPC 适配器实现
 */

// Types (port interfaces + transport interfaces)
export type {
  IResultHttpClient,
  IIpcClient,
  IRuleApiClient,
} from './adapters/types';

// Adapters
export {
  RuleHttpAdapter,
  createRuleHttpAdapter,
  createGovernanceHttpAdapters,
  RuleIpcAdapter,
  createRuleIpcAdapter,
  createGovernanceIpcAdapters,
} from './adapters';
