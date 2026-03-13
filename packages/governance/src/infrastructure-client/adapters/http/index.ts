/**
 * Governance HTTP Adapters - Registration.
 * 治理 HTTP 适配器 - 注册入口。
 *
 * Factory functions for creating HTTP-based governance adapters.
 * 创建基于 HTTP 的治理适配器的工厂函数。
 */

import type { IResultHttpClient } from '../types';
import { RuleHttpAdapter } from './rule-http.adapter';

export { RuleHttpAdapter, createRuleHttpAdapter } from './rule-http.adapter';

export interface GovernanceHttpAdapters {
  rule: RuleHttpAdapter;
}

export function createGovernanceHttpAdapters(
  httpClient: IResultHttpClient,
): GovernanceHttpAdapters {
  return {
    rule: new RuleHttpAdapter(httpClient),
  };
}
