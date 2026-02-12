/**
 * Get Goal Reviews
 *
 * 获取目标的所有复盘用例
 * 
 * **返回 Entity 对象**
 */

import type { IGoalApiClient } from '@/infrastructure-client';
import { GoalContainer } from '@/infrastructure-client';
import { GoalReview } from '@/domain-client';

/**
 * Get Goal Reviews
 */
export class GetGoalReviews {
  private static instance: GetGoalReviews;

  private constructor(private readonly apiClient: IGoalApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalApiClient): GetGoalReviews {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetGoalReviews.instance = new GetGoalReviews(client);
    return GetGoalReviews.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetGoalReviews {
    if (!GetGoalReviews.instance) {
      GetGoalReviews.instance = GetGoalReviews.createInstance();
    }
    return GetGoalReviews.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetGoalReviews.instance = undefined as unknown as GetGoalReviews;
  }

  /**
   * 执行用例
   * @returns 返回 Entity 对象数组
   */
  async execute(goalUuid: string): Promise<{ reviews: GoalReview[] }> {
    const response = await this.apiClient.getGoalReviewsByGoal(goalUuid);
    return {
      reviews: response.reviews.map(dto => GoalReview.fromServerDTO(dto)),
    };
  }
}

/**
 * 便捷函数
 */
export const getGoalReviews = (goalUuid: string): Promise<{ reviews: GoalReview[] }> =>
  GetGoalReviews.getInstance().execute(goalUuid);
