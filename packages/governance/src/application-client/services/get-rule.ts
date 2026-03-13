/**
 * Get Rule
 *
 * 获取规则用例
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { GetRuleReq } from '../../contracts/api/rules';
import { Rule } from '../../domain-client/aggregates/rule';
import type { IRuleApiClient } from '../../contracts/api/rule-api-client.port';
import { ruleFromDTO } from '../mappers/rule-dto-mapper';

/**
 * Get Rule.
 * 获取规则。
 *
 * Use case for fetching rules by ID or code via HTTP API. Requires IRuleApiClient
 * dependency injected via constructor for proper separation of concerns and testability.
 * 通过 HTTP API 按 ID 或代码获取规则的用例。需要通过构造函数注入 IRuleApiClient 依赖，
 * 以实现关注点分离和可测试性。
 */
export class GetRule {
  constructor(private readonly apiClient: IRuleApiClient) {}

  /**
   * Execute: Get rule by ID or code via API and return domain-model Rule
   */
  async execute(req: GetRuleReq): Promise<Result<Rule>> {
    const result = await this.apiClient.getRule(req);
    if (!result.ok) return result;
    return ok(ruleFromDTO(result.data));
  }
}
