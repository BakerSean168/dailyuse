/**
 * Search Rules
 *
 * 搜索规则用例
 */

import type { Result } from '@dailyuse/contracts/result';
import type { SearchRulesQuery } from '@/contracts/api/rules';
import { Rule } from '../../domain-client/aggregates/rule';
import type { IRuleApiClient } from '@/contracts/api/rule-api-client.port';
import { ruleFromDTO } from '../mappers/rule-dto-mapper';

interface SearchRulesResult {
  rules: Rule[];
  pagination: { page: number; pageSize: number; total: number };
}

/**
 * Search Rules
 */
export class SearchRules {
  private static instance: SearchRules;

  private constructor(private readonly apiClient: IRuleApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient: IRuleApiClient): SearchRules {
    SearchRules.instance = new SearchRules(apiClient);
    return SearchRules.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(apiClient?: IRuleApiClient): SearchRules {
    if (!SearchRules.instance) {
      if (!apiClient) {
        throw new Error('SearchRules: API client is required for initial instance creation');
      }
      SearchRules.instance = SearchRules.createInstance(apiClient);
    }
    return SearchRules.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    SearchRules.instance = undefined as unknown as SearchRules;
  }

  /**
   * 执行用例：搜索规则
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
