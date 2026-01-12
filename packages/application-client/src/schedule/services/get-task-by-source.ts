/**
 * Get Task By Source
 *
 * 根据来源获取任务用例
 */

import type { IScheduleTaskApiClient } from '@dailyuse/infrastructure-client';
import type { ScheduleTaskClientDTO, SourceModule } from '@dailyuse/contracts/schedule';
import { ScheduleContainer } from '@dailyuse/infrastructure-client';

/**
 * Get Task By Source
 */
export class GetTaskBySource {
  private static instance: GetTaskBySource;

  private constructor(private readonly apiClient: IScheduleTaskApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleTaskApiClient): GetTaskBySource {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getTaskApiClient();
    GetTaskBySource.instance = new GetTaskBySource(client);
    return GetTaskBySource.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetTaskBySource {
    if (!GetTaskBySource.instance) {
      GetTaskBySource.instance = GetTaskBySource.createInstance();
    }
    return GetTaskBySource.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetTaskBySource.instance = undefined as unknown as GetTaskBySource;
  }

  /**
   * 执行用例
   */
  async execute(sourceModule: SourceModule, sourceEntityId: string): Promise<ScheduleTaskClientDTO[]> {
    return this.apiClient.getTaskBySource(sourceModule, sourceEntityId);
  }
}
