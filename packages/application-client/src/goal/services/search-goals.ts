/**
 * Search Goals
 *
 * 搜索目标用例
 */

import type { IGoalApiClient } from '@dailyuse/infrastructure-client';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';
import { Goal } from '@dailyuse/domain-client/goal';
import { GoalContainer } from '@dailyuse/infrastructure-client';

/**
 * Search Goals
 */
export class SearchGoals {
  private static instance: SearchGoals;

  private constructor(private readonly apiClient: IGoalApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalApiClient): SearchGoals {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getApiClient();
    SearchGoals.instance = new SearchGoals(client);
    return SearchGoals.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): SearchGoals {
    if (!SearchGoals.instance) {
      SearchGoals.instance = SearchGoals.createInstance();
    }
    return SearchGoals.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    SearchGoals.instance = undefined as unknown as SearchGoals;
  }

  /**
   * 执行用例
   */
  async execute(params?: {
    keywords?: string;
    status?: string;
    dirUuid?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    goals: Goal[];
    pagination: { page: number; limit: number; total: number };
  }> {
    const response = await this.apiClient.searchGoals({
      query: params?.keywords || '',
      status: params?.status,
      dirUuid: params?.dirUuid,
      page: params?.page,
      limit: params?.limit,
    });

    const goals = (response.goals || []).map((goalData: GoalClientDTO) =>
      Goal.fromClientDTO(goalData),
    );

    return {
      goals,
      pagination: {
        page: response.page,
        limit: response.pageSize,
        total: response.total,
      },
    };
  }
}
