import type { GoalScheduleExecutionSource } from '@memoflow/goal/schedule-execution';
import type {
  ReminderScheduleExecutionSource,
  RoutineScheduleExecutionDeps,
} from '@memoflow/reminder/schedule-execution';
import type { TaskScheduleExecutionSource } from '@memoflow/task/schedule-execution';

/**
 * Legacy source-module fallback dependencies. NOTIF-3302 deliberately keeps
 * Notification out of this system-level router: business sources/handlers own
 * durable NotificationRequested side effects.
 */
export interface ScheduleOrchestrationExecutionDeps {
  readonly taskSource: TaskScheduleExecutionSource;
  readonly goalSource: GoalScheduleExecutionSource;
  readonly reminderSource: ReminderScheduleExecutionSource;
  /** ROUTINE-3401 durable execution deps; when present the module builds the wall-clock fence source. */
  readonly routineSource?: RoutineScheduleExecutionDeps;
}
