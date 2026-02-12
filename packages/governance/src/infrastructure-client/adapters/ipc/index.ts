/**
 * Governance IPC Adapters - Registration
 */

import type { IIpcClient } from '../types';
import { RuleIpcAdapter } from './rule-ipc.adapter';

export { RuleIpcAdapter, createRuleIpcAdapter } from './rule-ipc.adapter';

export interface GovernanceIpcAdapters {
  rule: RuleIpcAdapter;
}

export function createGovernanceIpcAdapters(ipcClient: IIpcClient): GovernanceIpcAdapters {
  return {
    rule: new RuleIpcAdapter(ipcClient),
  };
}
