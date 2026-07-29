import type {
  NotificationCategory,
  NotificationChannelType,
  NotificationType,
  RelatedEntityType,
} from '@memoflow/contracts/notification';
import type { ScheduleTask } from '@memoflow/schedule';

export interface GoalScheduleExecutionNotification {
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

export interface GoalScheduleExecutionOutcome {
  readonly nextRunAt?: number | null;
  readonly result?: Record<string, unknown>;
  readonly notification?: GoalScheduleExecutionNotification | null;
}

export interface GoalScheduleExecutionSource {
  executeGoal(task: ScheduleTask): Promise<GoalScheduleExecutionOutcome>;
}

export {
  createGoalPrismaScheduleExecutionSource,
  createGoalPowerSyncScheduleExecutionSource,
  createGoalScheduleExecutionSource,
  type CreateGoalScheduleExecutionSourceDeps,
} from '../server/infrastructure';
