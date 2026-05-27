/**
 * ScheduleTaskExecutorAdapter
 *
 * 将 ExecuteScheduleTaskByIdUseCase 适配为 ITaskHandler 接口
 * 这使得调度任务可以被 scheduler-server 调用
 *
 * 架构改进：
 * - scheduler-server 只依赖 ITaskHandler 接口
 * - application-server 实现接口
 * - 消除循环依赖
 */

import { createLogger } from '@dailyuse/utils/logger';
import { ExecuteScheduleTaskByIdUseCase } from './execute-schedule-task-by-id.use-case';

const logger = createLogger('ScheduleTaskExecutorAdapter');

/**
 * 任务处理器接口（本地定义）
 */
export interface ITaskHandler {
  execute(taskId: string, context?: unknown): Promise<void>;
}

/**
 * 将 ExecuteScheduleTaskByIdUseCase 适配为 ITaskHandler 接口
 *
 * 使用适配器模式，使现有的 use case 可以直接由
 * scheduler-server 的 IScheduler 调用
 */
export class ScheduleTaskExecutorAdapter implements ITaskHandler {
  private readonly executeById: ExecuteScheduleTaskByIdUseCase;

  constructor(executeById: ExecuteScheduleTaskByIdUseCase) {
    this.executeById = executeById;
  }

  /**
   * 实现 ITaskHandler 接口
   *
   * 由 Scheduler 在任务触发时调用
   *
   * @param taskId - 任务 ID (UUID)
   * @param context - 执行上下文（可选）
   */
  async execute(taskId: string, context?: unknown): Promise<void> {
    try {
      logger.info(`执行 Schedule 任务`, { taskId });

      await this.executeById.execute(taskId);

      logger.info(`Schedule 任务执行完成`, { taskId });
    } catch (error) {
      logger.error(`Schedule 任务执行失败`, { taskId, error });
      throw error;
    }
  }
}
