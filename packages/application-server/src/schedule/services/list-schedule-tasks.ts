/**
 * List Schedule Tasks Service
 *
 * 获取调度任务列表
 */

import type { IScheduleTaskRepository } from '@dailyuse/domain-server/schedule';
import type {
  ScheduleTaskClientDTO,
  ScheduleTaskQueryParamsDTO,
} from '@dailyuse/contracts/schedule';
import { ScheduleContainer } from '@dailyuse/infrastructure-server';

/**
 * List Schedule Tasks Service
 */
export class ListScheduleTasks {
  private static instance: ListScheduleTasks;

  private constructor(private readonly taskRepository: IScheduleTaskRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(taskRepository?: IScheduleTaskRepository): ListScheduleTasks {
    const container = ScheduleContainer.getInstance();
    const repo = taskRepository || container.getScheduleTaskRepository();
    ListScheduleTasks.instance = new ListScheduleTasks(repo);
    return ListScheduleTasks.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ListScheduleTasks {
    if (!ListScheduleTasks.instance) {
      ListScheduleTasks.instance = ListScheduleTasks.createInstance();
    }
    return ListScheduleTasks.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ListScheduleTasks.instance = undefined as unknown as ListScheduleTasks;
  }

  async execute(accountUuid: string, query?: ScheduleTaskQueryParamsDTO): Promise<{ tasks: ScheduleTaskClientDTO[]; total: number }> {
    let tasks;

    if (query?.sourceModule && query?.sourceEntityId) {
      tasks = await this.taskRepository.findBySourceEntity(
        query.sourceModule,
        query.sourceEntityId,
      );
    } else {
      tasks = await this.taskRepository.findByAccountUuid(accountUuid);
    }

    return {
      tasks: tasks.map((task) => task.toClientDTO()),
      total: tasks.length,
    };
  }
}
