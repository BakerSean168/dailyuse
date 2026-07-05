import { SourceModule } from '@dailyuse/contracts/schedule';
import type { ScheduleTask } from '@dailyuse/schedule';
import type { ScheduleNotificationRequest } from '../ports/execution';
import type { ScheduleOrchestrationExecutionDeps } from '../ports/execution';

type ScheduleExecutionOutcome = {
  readonly nextRunAt?: number | null;
  readonly result?: Record<string, unknown>;
  readonly notification?: ScheduleNotificationRequest | null;
};

async function finalizeExecution(
  outcome: ScheduleExecutionOutcome,
  notificationPort: ScheduleOrchestrationExecutionDeps['notificationPort'],
): Promise<{ nextRunAt?: number | null; result?: Record<string, unknown> }> {
  if (outcome.notification) {
    await notificationPort.createNotification(outcome.notification);
  }

  return {
    nextRunAt: outcome.nextRunAt,
    result: outcome.result,
  };
}

export function createScheduleExecutionRouter(options: ScheduleOrchestrationExecutionDeps) {
  return {
    async execute(task: ScheduleTask) {
      if (task.sourceModule === SourceModule.Reminder) {
        return finalizeExecution(
          await options.reminderSource.executeReminder(task),
          options.notificationPort,
        );
      }

      if (task.sourceModule === SourceModule.Goal) {
        return finalizeExecution(
          await options.goalSource.executeGoal(task),
          options.notificationPort,
        );
      }

      if (task.sourceModule === SourceModule.Task) {
        return finalizeExecution(
          await options.taskSource.executeTask(task),
          options.notificationPort,
        );
      }

      throw new Error(`Unsupported schedule source module: ${task.sourceModule}`);
    },
  };
}
