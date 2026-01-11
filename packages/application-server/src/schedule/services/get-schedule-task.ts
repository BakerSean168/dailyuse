/**
 * Get Schedule Task Service
 *
 * 获取调度任务详情
 */

import type { IScheduleTaskRepository } from '@dailyuse/domain-server/schedule';
import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';
import { ScheduleContainer } from '@dailyuse/infrastructure-server';

/**
 * Get Schedule Task Service
 */
export class GetScheduleTask {
  private static instance: GetScheduleTask;

  private constructor(private readonly taskRepository: IScheduleTaskRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(taskRepository?: IScheduleTaskRepository): GetScheduleTask {
    const container = ScheduleContainer.getInstance();
    const repo = taskRepository || container.getScheduleTaskRepository();
    GetScheduleTask.instance = new GetScheduleTask(repo);
    return GetScheduleTask.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetScheduleTask {
    if (!GetScheduleTask.instance) {
      GetScheduleTask.instance = GetScheduleTask.createInstance();
    }
    return GetScheduleTask.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetScheduleTask.instance = undefined as unknown as GetScheduleTask;
  }

  async execute(uuid: string): Promise<ScheduleTaskClientDTO | null> {
    const task = await this.taskRepository.findByUuid(uuid);
    return task ? task.toClientDTO() : null;
  }
}
