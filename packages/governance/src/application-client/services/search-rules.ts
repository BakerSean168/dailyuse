/**
 * Search Rules
 *
 * 搜索规则用例
 */

import type { SearchRulesQuery, SearchRulesRes } from '@/contracts/api';
import { Rule } from '../../domain-client/aggregates/rule';
import type { IRuleApiClient } from '@/contracts/api';

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
  async execute(query: SearchRulesQuery): Promise<{
    rules: Rule[];
    pagination: { page: number; pageSize: number; total: number };
  }> {
    const response = await this.apiClient.searchRules(query);

    const rules = response.items.map((dto) => Rule.fromDTO(dto));

    return {
      rules,
      pagination: {
        page: response.page,
        pageSize: response.pageSize,
        total: response.total,
      },
    };
  }
}
