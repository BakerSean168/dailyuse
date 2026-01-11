/**
 * Pause Schedule Task Service
 *
 * 暂停调度任务
 */

import type {
  IScheduleTaskRepository,
  IScheduleStatisticsRepository,
} from '@dailyuse/domain-server/schedule';
import { ScheduleDomainService } from '@dailyuse/domain-server/schedule';
import { ScheduleContainer } from '@dailyuse/infrastructure-server';

/**
 * Pause Schedule Task Service
 */
export class PauseScheduleTask {
  private static instance: PauseScheduleTask;
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
  ): PauseScheduleTask {
    const container = ScheduleContainer.getInstance();
    const taskRepo = taskRepository || container.getScheduleTaskRepository();
    const statsRepo = statisticsRepository || container.getStatisticsRepository();
    PauseScheduleTask.instance = new PauseScheduleTask(taskRepo, statsRepo);
    return PauseScheduleTask.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): PauseScheduleTask {
    if (!PauseScheduleTask.instance) {
      PauseScheduleTask.instance = PauseScheduleTask.createInstance();
    }
    return PauseScheduleTask.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    PauseScheduleTask.instance = undefined as unknown as PauseScheduleTask;
  }

  async execute(uuid: string): Promise<void> {
    await this.domainService.pauseScheduleTask(uuid);
  }
}
