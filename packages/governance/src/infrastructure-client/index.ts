/**
 * Infrastructure Client Layer — Barrel Export.
 * 基础设施客户端层 —— 统一导出。
 *
 * Client-side infrastructure provides transport adapters that implement
 * the same port interface (IRuleApiClient) over different channels:
 * 客户端基础设施提供在同一端口接口（IRuleApiClient）上、通过不同通道实现的传输适配器：
 *
 * - HTTP adapter: REST API calls for web/desktop
 *   HTTP 适配器：面向 Web/Desktop 的 REST API 调用
 * - IPC adapter: Electron IPC for desktop (main↔renderer)
 *   IPC 适配器：面向 Electron 桌面端的 IPC 通信（main↔renderer）
 *
 * Factory pattern: `createGovernanceHttpAdapters(client)` / `createGovernanceIpcAdapters(client)`
 * 工厂模式：通过工厂函数一次性创建所有适配器
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
