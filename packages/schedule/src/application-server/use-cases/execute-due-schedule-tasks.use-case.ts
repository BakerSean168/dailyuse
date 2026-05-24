import { createLogger } from '@dailyuse/utils';
import type { IScheduleTaskRepository } from '../../domain-server/repositories/i-schedule-task-repository';
import type { IScheduleTaskMonitor } from './schedule-executor-helpers';
import { FindDueScheduleTasksUseCase } from './find-due-schedule-tasks.use-case';
import { ExecuteScheduleTaskUseCase } from './execute-schedule-task.use-case';
import { getCannotExecuteReason } from './schedule-executor-helpers';

const logger = createLogger('ExecuteDueScheduleTasksUseCase');

/**
 * 批量执行所有到期的 ScheduleTask
 */
export class ExecuteDueScheduleTasksUseCase {
  constructor(
    private readonly repository: IScheduleTaskRepository,
    private readonly monitor: IScheduleTaskMonitor,
  ) {}

  async execute(beforeTime?: number): Promise<{
    total: number;
    executed: number;
    skipped: number;
    failed: number;
  }> {
    const findDueTasks = new FindDueScheduleTasksUseCase(this.repository);
    const executeTask = new ExecuteScheduleTaskUseCase(this.repository, this.monitor);
    const tasks = await findDueTasks.execute(beforeTime);

    const results = {
      total: tasks.length,
      executed: 0,
      skipped: 0,
      failed: 0,
    };

    for (const task of tasks) {
      try {
        if (!task.canExecute()) {
          const reason = getCannotExecuteReason(task);
          this.monitor.recordExecutionSkipped(task.id, task.taskName, reason);
          results.skipped++;
          continue;
        }

        await executeTask.execute(task);
        results.executed++;
      } catch (error) {
        results.failed++;
        logger.error('任务执行异常', {
          taskId: task.id,
          error,
        });
      }
    }
    logger.info('批量执行完成', results);

    return results;
  }
}
