/**
 * Update Rule
 *
 * 更新规则用例
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { UpdateRuleReq } from '../../contracts/api/rules';
import { Rule } from '../../domain-client/aggregates/rule';
import type { IRuleApiClient } from '../../contracts/api/rule-api-client.port';
import { ruleFromDTO } from '../mappers/rule-dto-mapper';

/**
 * Update Rule
 *
 * Use case for updating rules via HTTP API. Requires IRuleApiClient dependency
 * injected via constructor for proper separation of concerns and testability.
 */
export class UpdateRule {
  constructor(private readonly apiClient: IRuleApiClient) {}

  /**
   * Execute: Update rule via API and return domain-model Rule
   */
  async execute(ruleId: string, req: UpdateRuleReq): Promise<Result<Rule>> {
    const result = await this.apiClient.updateRule(ruleId, req);
    if (!result.ok) return result;
    return ok(ruleFromDTO(result.data));
  }
}
