/**
 * Governance HTTP Adapters - Registration
 */

import type { IResultHttpClient } from '../types';
import { RuleHttpAdapter } from './rule-http.adapter';

export { RuleHttpAdapter, createRuleHttpAdapter } from './rule-http.adapter';

export interface GovernanceHttpAdapters {
  rule: RuleHttpAdapter;
}

export function createGovernanceHttpAdapters(httpClient: IResultHttpClient): GovernanceHttpAdapters {
  return {
    rule: new RuleHttpAdapter(httpClient),
  };
}
