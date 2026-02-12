/**
 * Get Schedule Conflicts
 *
 * 获取日程冲突详情用例
 */

import type { IScheduleEventApiClient } from '../../infrastructure-client/adapters/types';
import type { ConflictDetectionResult } from '@dailyuse/contracts/schedule';
import { ScheduleContainer } from '../../infrastructure-client/schedule.container';

/**
 * Get Schedule Conflicts
 */
export class GetScheduleConflicts {
  private static instance: GetScheduleConflicts;

  private constructor(private readonly apiClient: IScheduleEventApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleEventApiClient): GetScheduleConflicts {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getEventApiClient();
    GetScheduleConflicts.instance = new GetScheduleConflicts(client);
    return GetScheduleConflicts.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetScheduleConflicts {
    if (!GetScheduleConflicts.instance) {
      GetScheduleConflicts.instance = GetScheduleConflicts.createInstance();
    }
    return GetScheduleConflicts.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetScheduleConflicts.instance = undefined as unknown as GetScheduleConflicts;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<ConflictDetectionResult> {
    return this.apiClient.getScheduleConflicts(uuid);
  }
}

/**
 * 便捷函数
 */
export const getScheduleConflicts = (uuid: string): Promise<ConflictDetectionResult> =>
  GetScheduleConflicts.getInstance().execute(uuid);
