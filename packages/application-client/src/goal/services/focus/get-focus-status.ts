/**
 * Get Focus Status
 *
 * 获取当前专注状态用例
 */

import type { IGoalFocusApiClient } from '@dailyuse/infrastructure-client';
import type { FocusStatusDTO } from '@dailyuse/contracts/goal';
import { GoalContainer } from '@dailyuse/infrastructure-client';

/**
 * Get Focus Status Use Case
 */
export class GetFocusStatus {
  private static instance: GetFocusStatus;

  private constructor(private readonly apiClient: IGoalFocusApiClient) {}

  static createInstance(apiClient?: IGoalFocusApiClient): GetFocusStatus {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getFocusApiClient();
    GetFocusStatus.instance = new GetFocusStatus(client);
    return GetFocusStatus.instance;
  }

  static getInstance(): GetFocusStatus {
    if (!GetFocusStatus.instance) {
      GetFocusStatus.instance = GetFocusStatus.createInstance();
    }
    return GetFocusStatus.instance;
  }

  static resetInstance(): void {
    GetFocusStatus.instance = undefined as unknown as GetFocusStatus;
  }

  async execute(): Promise<FocusStatusDTO> {
    return this.apiClient.getStatus();
  }
}
