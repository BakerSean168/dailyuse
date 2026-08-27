import type {
  NotificationCategory,
  NotificationChannelType,
  NotificationType,
  RelatedEntityType,
} from '@memoflow/contracts/notification';
import type { ScheduleTask } from '@memoflow/schedule';

export interface TaskScheduleExecutionNotification {
  readonly identityId: string;
  readonly title: string;
  readonly content: string;
  readonly type: NotificationType;
  readonly category: NotificationCategory;
  readonly relatedEntityType?: RelatedEntityType;
  readonly relatedEntityId?: string;
  readonly channels?: readonly NotificationChannelType[];
  readonly expiresAt?: number | null;
}

export interface TaskScheduleExecutionOutcome {
  readonly nextRunAt?: number | null;
  readonly result?: Record<string, unknown>;
  readonly notification?: TaskScheduleExecutionNotification | null;
}

export interface TaskScheduleExecutionSource {
  executeTask(task: ScheduleTask): Promise<TaskScheduleExecutionOutcome>;
}

export {
  createTaskPrismaScheduleExecutionSource,
  createTaskPowerSyncScheduleExecutionSource,
  createTaskScheduleExecutionSource,
  type CreateTaskScheduleExecutionSourceDeps,
} from '../server/infrastructure';

export {
  createTaskReminderScheduledHandlerRegistration,
  buildTaskReminderOperationId,
  TASK_REMINDER_BUSINESS_SOURCE,
  TASK_REMINDER_WORKFLOW_KEY,
  type CreateTaskReminderScheduledHandlerRegistrationDeps,
} from '../server/infrastructure';
