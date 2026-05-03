/**
 * Governance HTTP Adapters — Factory & Registration.
 * 治理 HTTP 适配器 —— 工厂与注册入口。
 *
 * Factory pattern: creates all HTTP-based adapters in a single call.
 * 工厂模式：一次调用创建所有基于 HTTP 的适配器。
 *
 * Usage:
 * 用法：
 * ```ts
 * const adapters = createGovernanceHttpAdapters(httpClient);
 * // adapters.rule.createRule(...)  ← all adapters ready
 * ```
 *
 * Individual adapter factories (createRuleHttpAdapter) are also exported
 * for granular control in tests.
 * 单独的适配器工厂（createRuleHttpAdapter）也已导出，方便测试中精细控制。
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
