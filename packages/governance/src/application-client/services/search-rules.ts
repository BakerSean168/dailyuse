/**
 * Search Rules
 *
 * 搜索规则用例
 */

import type { Result } from '@dailyuse/contracts/result';
import type { SearchRulesQuery } from '../../contracts/api/rules';
import { Rule } from '../../domain-client/aggregates/rule';
import type { IRuleApiClient } from '../../contracts/api/rule-api-client.port';
import { ruleFromDTO } from '../mappers/rule-dto-mapper';

interface SearchRulesResult {
  rules: Rule[];
  pagination: { page: number; pageSize: number; total: number };
}

/**
 * Search Rules
 *
 * Use case for searching rules via HTTP API. Requires IRuleApiClient dependency
 * injected via constructor for proper separation of concerns and testability.
 */
export class SearchRules {
  constructor(private readonly apiClient: IRuleApiClient) {}

  /**
   * Execute: Search rules via API with pagination
   */
  async execute(query: SearchRulesQuery): Promise<Result<SearchRulesResult>> {
    const result = await this.apiClient.searchRules(query);
    if (!result.ok) return result;

    const response = result.data;
    const rules = response.items.map((dto) => ruleFromDTO(dto));

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
