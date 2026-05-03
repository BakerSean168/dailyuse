import { createLogger } from '@dailyuse/utils';
import type { IScheduleTaskRepository } from '../../domain-server/repositories/IScheduleTaskRepository';
import type { IScheduleTaskMonitor } from './schedule-executor-helpers';
import { ExecuteScheduleTaskUseCase } from './execute-schedule-task.use-case';
import { getCannotExecuteReason } from './schedule-executor-helpers';

const logger = createLogger('ExecuteScheduleTaskByIdUseCase');

/**
 * 执行指定 UUID 的 ScheduleTask
 */
export class ExecuteScheduleTaskByIdUseCase {
  constructor(
    private readonly repository: IScheduleTaskRepository,
    private readonly monitor: IScheduleTaskMonitor,
  ) {}

  async execute(taskId: string): Promise<void> {
    const task = await this.repository.findById(taskId);
    if (!task) {
      const errorMsg = `任务不存在: ${taskId}`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    const taskName = task.taskName;

    if (!task.canExecute()) {
      const reason = getCannotExecuteReason(task);
      this.monitor.recordExecutionSkipped(taskId, taskName, reason);
      logger.warn(`任务不满足执行条件，跳过执行`, { taskId, taskName, reason });
      return;
    }

    const executeTask = new ExecuteScheduleTaskUseCase(this.repository, this.monitor);
    await executeTask.execute(task);
  }
}
