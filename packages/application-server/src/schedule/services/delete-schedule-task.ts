/**
 * Delete Schedule Task Service
 *
 * 删除调度任务
 */

import type {
  IScheduleTaskRepository,
  IScheduleStatisticsRepository,
} from '@dailyuse/domain-server/schedule';
import { ScheduleDomainService } from '@dailyuse/domain-server/schedule';
import { ScheduleContainer } from '@dailyuse/infrastructure-server';

/**
 * Delete Schedule Task Service
 */
export class DeleteScheduleTask {
  private static instance: DeleteScheduleTask;
  private readonly domainService: ScheduleDomainService;

  private constructor(
    private readonly taskRepository: IScheduleTaskRepository,
    private readonly statisticsRepository: IScheduleStatisticsRepository,
  ) {
    this.domainService = new ScheduleDomainService(taskRepository, statisticsRepository);
  }

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(
    taskRepository?: IScheduleTaskRepository,
    statisticsRepository?: IScheduleStatisticsRepository,
  ): DeleteScheduleTask {
    const container = ScheduleContainer.getInstance();
    const taskRepo = taskRepository || container.getScheduleTaskRepository();
    const statsRepo = statisticsRepository || container.getStatisticsRepository();
    DeleteScheduleTask.instance = new DeleteScheduleTask(taskRepo, statsRepo);
    return DeleteScheduleTask.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): DeleteScheduleTask {
    if (!DeleteScheduleTask.instance) {
      DeleteScheduleTask.instance = DeleteScheduleTask.createInstance();
    }
    return DeleteScheduleTask.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    DeleteScheduleTask.instance = undefined as unknown as DeleteScheduleTask;
  }

  async execute(uuid: string): Promise<void> {
    await this.domainService.deleteScheduleTask(uuid);
  }
}
