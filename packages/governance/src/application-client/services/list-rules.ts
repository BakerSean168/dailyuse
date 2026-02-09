/**
 * List Rules
 *
 * 获取规则列表用例
 */

import type { ListRulesQuery, ListRulesRes } from '@/contracts/api';
import { Rule } from '../../domain-client/aggregates/rule';
import type { IRuleApiClient } from '@/contracts/api';

/**
 * List Rules
 */
export class ListRules {
  private static instance: ListRules;

  private constructor(private readonly apiClient: IRuleApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient: IRuleApiClient): ListRules {
    ListRules.instance = new ListRules(apiClient);
    return ListRules.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(apiClient?: IRuleApiClient): ListRules {
    if (!ListRules.instance) {
      if (!apiClient) {
        throw new Error('ListRules: API client is required for initial instance creation');
      }
      ListRules.instance = ListRules.createInstance(apiClient);
    }
    return ListRules.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ListRules.instance = undefined as unknown as ListRules;
  }

  /**
   * 执行用例：获取规则列表
   */
  async execute(query?: ListRulesQuery): Promise<{
    rules: Rule[];
    pagination: { page: number; pageSize: number; total: number };
  }> {
    const response = await this.apiClient.listRules(query);

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
