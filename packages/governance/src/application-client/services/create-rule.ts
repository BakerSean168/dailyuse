/**
 * Create Rule
 *
 * 创建规则用例
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { CreateRuleReq } from '../../contracts/api/rules';
import { Rule } from '../../domain-client/aggregates/rule';
import type { IRuleApiClient } from '../../contracts/api/rule-api-client.port';
import { ruleFromDTO } from '../mappers/rule-dto-mapper';

/**
 * Create Rule
 *
 * Use case for creating rules via HTTP API. Requires IRuleApiClient dependency
 * injected via constructor for proper separation of concerns and testability.
 */
export class CreateRule {
  constructor(private readonly apiClient: IRuleApiClient) {}

  /**
   * Execute: Create rule via API and return domain-model Rule
   */
  async execute(req: CreateRuleReq): Promise<Result<Rule>> {
    const result = await this.apiClient.createRule(req);
    if (!result.ok) return result;
    return ok(ruleFromDTO(result.data));
  }
}
