/**
 * Resume Schedule Task Service
 *
 * 恢复调度任务
 */

import type {
  IScheduleTaskRepository,
  IScheduleStatisticsRepository,
} from '@dailyuse/domain-server/schedule';
import { ScheduleDomainService } from '@dailyuse/domain-server/schedule';
import { ScheduleContainer } from '@dailyuse/infrastructure-server';

/**
 * Resume Schedule Task Service
 */
export class ResumeScheduleTask {
  private static instance: ResumeScheduleTask;
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
  ): ResumeScheduleTask {
    const container = ScheduleContainer.getInstance();
    const taskRepo = taskRepository || container.getScheduleTaskRepository();
    const statsRepo = statisticsRepository || container.getStatisticsRepository();
    ResumeScheduleTask.instance = new ResumeScheduleTask(taskRepo, statsRepo);
    return ResumeScheduleTask.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ResumeScheduleTask {
    if (!ResumeScheduleTask.instance) {
      ResumeScheduleTask.instance = ResumeScheduleTask.createInstance();
    }
    return ResumeScheduleTask.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ResumeScheduleTask.instance = undefined as unknown as ResumeScheduleTask;
  }

  async execute(uuid: string): Promise<void> {
    await this.domainService.resumeScheduleTask(uuid);
  }
}
