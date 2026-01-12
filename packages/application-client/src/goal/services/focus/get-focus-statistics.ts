/**
 * Get Focus Statistics
 *
 * 获取专注统计用例
 */

import type { IGoalFocusApiClient } from '@dailyuse/infrastructure-client';
import type { FocusStatisticsDTO } from '@dailyuse/contracts/goal';
import { GoalContainer } from '@dailyuse/infrastructure-client';

/**
 * Get Focus Statistics Use Case
 */
export class GetFocusStatistics {
  private static instance: GetFocusStatistics;

  private constructor(private readonly apiClient: IGoalFocusApiClient) {}

  static createInstance(apiClient?: IGoalFocusApiClient): GetFocusStatistics {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getFocusApiClient();
    GetFocusStatistics.instance = new GetFocusStatistics(client);
    return GetFocusStatistics.instance;
  }

  static getInstance(): GetFocusStatistics {
    if (!GetFocusStatistics.instance) {
      GetFocusStatistics.instance = GetFocusStatistics.createInstance();
    }
    return GetFocusStatistics.instance;
  }

  static resetInstance(): void {
    GetFocusStatistics.instance = undefined as unknown as GetFocusStatistics;
  }

  async execute(goalUuid?: string): Promise<FocusStatisticsDTO> {
    return this.apiClient.getStatistics(goalUuid);
  }
}
