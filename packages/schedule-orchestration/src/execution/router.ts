import { SourceModule } from '@memoflow/contracts/schedule';
import type { ScheduleTask } from '@memoflow/schedule';
import type { ScheduleOrchestrationExecutionDeps } from '../ports/execution';

/**
 * Domain-neutral legacy SourceModule fallback. Business side effects live in
 * the source boundary itself; the router only selects which source executes.
 */
export function createScheduleExecutionRouter(options: ScheduleOrchestrationExecutionDeps) {
  return {
    async execute(task: ScheduleTask) {
      if (task.sourceModule === SourceModule.Reminder) {
        return options.reminderSource.executeReminder(task);
      }
      if (task.sourceModule === SourceModule.Goal) {
        return options.goalSource.executeGoal(task);
      }
      if (task.sourceModule === SourceModule.Task) {
        return options.taskSource.executeTask(task);
      }
      throw new Error(`Unsupported schedule source module: ${task.sourceModule}`);
    },
  };
}
