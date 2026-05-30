/**
 * Governance IPC Adapters — Factory & Registration.
 * 治理 IPC 适配器 —— 工厂与注册入口。
 *
 * Factory pattern: creates all IPC-based adapters in a single call.
 * 工厂模式：一次调用创建所有基于 IPC 的适配器。
 *
 * Usage (Electron renderer process):
 * 用法（Electron 渲染进程）：
 * ```ts
 * const adapters = createGovernanceIpcAdapters(ipcClient);
 * // adapters.rule.createRule(...)  ← delegates to main process via IPC
 * ```
 *
 * Individual adapter factories (createRuleIpcAdapter) are also exported
 * for granular control in tests.
 * 单独的适配器工厂（createRuleIpcAdapter）也已导出，方便测试中精细控制。
 */

import type { IResultIpcClient } from '../types';
import { RuleIpcAdapter } from './rule-ipc.adapter';

export { RuleIpcAdapter, createRuleIpcAdapter } from './rule-ipc.adapter';

export interface GovernanceIpcAdapters {
  rule: RuleIpcAdapter;
}

/**
 * createGovernanceIpcAdapters — auto-added minimal docs.
 *
 * 中文：自动添加的最小 JSDoc。
 * @param ipcClient - 
 * @returns any - 
 */
export function createGovernanceIpcAdapters(ipcClient: IResultIpcClient): GovernanceIpcAdapters {
  return {
    rule: new RuleIpcAdapter(ipcClient),
  };
}
