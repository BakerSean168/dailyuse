/**
 * Governance IPC Adapters - Registration.
 * 治理 IPC 适配器 - 注册入口。
 *
 * Factory functions for creating IPC-based governance adapters.
 * 创建基于 IPC 的治理适配器的工厂函数。
 */

import type { IResultIpcClient } from '../types';
import { RuleIpcAdapter } from './rule-ipc.adapter';

export { RuleIpcAdapter, createRuleIpcAdapter } from './rule-ipc.adapter';

export interface GovernanceIpcAdapters {
  rule: RuleIpcAdapter;
}

export function createGovernanceIpcAdapters(ipcClient: IResultIpcClient): GovernanceIpcAdapters {
  return {
    rule: new RuleIpcAdapter(ipcClient),
  };
}
