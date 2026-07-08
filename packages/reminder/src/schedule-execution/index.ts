import type {
  NotificationCategory,
  NotificationChannelType,
  NotificationType,
  RelatedEntityType,
} from '@dailyuse/contracts/notification';

export interface ReminderScheduleExecutionTask {
  readonly sourceEntityId: string;
}

export interface ReminderScheduleExecutionNotification {
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

export interface ReminderScheduleExecutionOutcome {
  readonly nextRunAt?: number | null;
  readonly result?: Record<string, unknown>;
  readonly notification?: ReminderScheduleExecutionNotification | null;
}

export interface ReminderScheduleExecutionSource {
  executeReminder(task: ReminderScheduleExecutionTask): Promise<ReminderScheduleExecutionOutcome>;
}

export {
  createReminderPrismaScheduleExecutionSource,
  createReminderPowerSyncScheduleExecutionSource,
  createReminderScheduleExecutionSource,
  type CreateReminderScheduleExecutionSourceDeps,
} from '../server/infrastructure';
