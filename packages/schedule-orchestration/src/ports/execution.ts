import type { GoalScheduleExecutionSource } from '@dailyuse/goal/schedule-execution';
import type { ScheduleNotificationPort, ScheduleNotificationRequest } from '@dailyuse/notification/schedule-execution';
import type { ReminderScheduleExecutionSource } from '@dailyuse/reminder/schedule-execution';
import type { TaskScheduleExecutionSource } from '@dailyuse/task/schedule-execution';

export type { ScheduleNotificationPort, ScheduleNotificationRequest };

export interface ScheduleOrchestrationExecutionDeps {
  readonly taskSource: TaskScheduleExecutionSource;
  readonly goalSource: GoalScheduleExecutionSource;
  readonly reminderSource: ReminderScheduleExecutionSource;
  readonly notificationPort: ScheduleNotificationPort;
}
