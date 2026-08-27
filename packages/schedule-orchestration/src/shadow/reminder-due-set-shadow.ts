import { SourceModule } from '@memoflow/contracts/schedule';
import type { ReminderDueSetReader } from '@memoflow/reminder';
import type { IScheduleTaskRepository } from '@memoflow/schedule';

/**
 * Scheduler-side read model used by the ROUTINE-3402 legacy due-set shadow.
 * It intentionally filters after the unbounded system due query so unrelated
 * Goal/Task/Routine work cannot consume the Reminder comparison limit.
 */
export function createReminderSchedulerDueSetReader(
  scheduleTaskRepository: Pick<IScheduleTaskRepository, 'findDueTasksForExecution'>,
): ReminderDueSetReader {
  return {
    async readDueSet(beforeTime, limit = 100) {
      const due = await scheduleTaskRepository.findDueTasksForExecution(new Date(beforeTime));
      return due
        .filter((task) => task.sourceModule === SourceModule.Reminder && task.nextRunAt !== null)
        .map((task) => ({
          identityId: String(task.identityId),
          reminderId: task.sourceEntityId,
          dueAt: task.nextRunAt!.getTime(),
        }))
        .sort(
          (a, b) =>
            a.dueAt - b.dueAt ||
            a.identityId.localeCompare(b.identityId) ||
            a.reminderId.localeCompare(b.reminderId),
        )
        .slice(0, Math.max(1, limit));
    },
  };
}
