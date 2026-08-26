import type { GoalScheduleExecutionSource } from '@memoflow/goal/schedule-execution';
import type { ScheduleNotificationPort, ScheduleNotificationRequest } from '@memoflow/notification/schedule-execution';
import type { ReminderScheduleExecutionSource, RoutineScheduleExecutionDeps } from '@memoflow/reminder/schedule-execution';
import type { TaskScheduleExecutionSource } from '@memoflow/task/schedule-execution';

export type { ScheduleNotificationPort, ScheduleNotificationRequest };

export interface ScheduleOrchestrationExecutionDeps {
  readonly taskSource: TaskScheduleExecutionSource;
  readonly goalSource: GoalScheduleExecutionSource;
  readonly reminderSource: ReminderScheduleExecutionSource;
  readonly notificationPort: ScheduleNotificationPort;
  /** ROUTINE-3401 durable execution deps; when present the module builds the wall-clock fence source. */
  readonly routineSource?: RoutineScheduleExecutionDeps;
}
