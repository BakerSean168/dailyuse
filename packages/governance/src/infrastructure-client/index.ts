/**
 * Infrastructure Client Layer - Barrel Export
 * 基础设施客户端层 - 统一导出
 *
 * 提供规则模块的 HTTP 和 IPC 适配器实现
 */

// Types (port interfaces + transport interfaces)
export type { IResultHttpClient, IResultIpcClient } from './adapters/types';

/**
 * @internal Re-exported for convenience — canonical export is from `@dailyuse/governance/contracts`.
 * @internal 便捷重导出 — 规范导出位于 `@dailyuse/governance/contracts`。
 */
export type { IRuleApiClient } from './adapters/types';

// Adapters
export {
  RuleHttpAdapter,
  createRuleHttpAdapter,
  createGovernanceHttpAdapters,
  RuleIpcAdapter,
  createRuleIpcAdapter,
  createGovernanceIpcAdapters,
} from './adapters';
