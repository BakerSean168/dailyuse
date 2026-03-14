/**
 * List Rules
 *
 * 获取规则列表用例
 */

import type { Result } from '@dailyuse/contracts/result';
import { error } from '@dailyuse/contracts/result';
import type { ListRulesQuery } from '../../contracts/api/rules';
import { Rule } from '../../domain-client/aggregates/rule';
import type { IRuleApiClient } from '../../contracts/api/rule-api-client.port';
import { ruleFromDTO } from '../mappers/rule-dto-mapper';

interface ListRulesResult {
  rules: Rule[];
  pagination: { page: number; pageSize: number; total: number };
}

/**
 * List Rules.
 * 获取规则列表。
 *
 * Use case for listing rules via HTTP API. Requires IRuleApiClient dependency
 * injected via constructor for proper separation of concerns and testability.
 * 通过 HTTP API 获取规则列表的用例。需要通过构造函数注入 IRuleApiClient 依赖，
 * 以实现关注点分离和可测试性。
 */
export class ListRules {
  constructor(private readonly apiClient: IRuleApiClient) {}

  /**
   * Execute: List rules via API with pagination
   */
  async execute(query?: ListRulesQuery): Promise<Result<ListRulesResult>> {
    const result = await this.apiClient.listRules(query);
    if (!result.ok) return result;

    const response = result.data;
    const rules: Rule[] = [];
    for (const dto of response.items) {
      const mapped = ruleFromDTO(dto);
      if (!mapped.ok) return error(mapped.error.code, mapped.error.message, mapped.error.details);
      rules.push(mapped.data);
    }

    return {
      ok: true,
      data: {
        rules,
        pagination: {
          page: response.page,
          pageSize: response.pageSize,
          total: response.total,
        },
      },
    };
  }
}
