/**
 * Governance HTTP Adapters - Registration
 */

import type { IHttpClient } from '../types';
import { RuleHttpAdapter } from './rule-http.adapter';

export { RuleHttpAdapter, createRuleHttpAdapter } from './rule-http.adapter';

export interface GovernanceHttpAdapters {
  rule: RuleHttpAdapter;
}

export function createGovernanceHttpAdapters(httpClient: IHttpClient): GovernanceHttpAdapters {
  return {
    rule: new RuleHttpAdapter(httpClient),
  };
}
