import type {
  NotificationCategory,
  NotificationChannelType,
  NotificationType,
  RelatedEntityType,
} from '@memoflow/contracts/notification';

export interface ReminderScheduleExecutionTask {
  readonly identityId: string;
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

// ============ Routine wall-clock lane (ROUTINE-3401) ============
export {
  ROUTINE_OCCURRENCE_LEASE_MS,
  createRoutineWallClockExecutionSource,
  type RoutineScheduleExecutionDeps,
  type RoutineScheduleExecutionInput,
  type RoutineScheduleExecutionOutcome,
  type RoutineScheduleExecutionSource,
} from '../server/infrastructure/routine-schedule/routine-schedule-execution-source';
export {
  createRoutineWallClockScheduledHandler,
} from '../server/infrastructure/routine-schedule/routine-wall-clock-scheduled-handler';
export {
  ROUTINE_WALLCLOCK_HANDLER_KEY,
  ROUTINE_WALLCLOCK_PAYLOAD_VERSION,
  buildRoutineWallClockPayload,
  parseRoutineWallClockPayload,
  type RoutineWallClockOccurrencePayload,
} from '../server/infrastructure/routine-schedule/routine-schedule-contract';
export {
  createInMemoryRoutineOccurrenceStore,
} from '../server/infrastructure/routine-schedule/routine-occurrence-store.in-memory';
export {
  PrismaRoutineOccurrenceStore,
} from '../server/infrastructure/routine-schedule/routine-occurrence-store.prisma';
export {
  createInMemoryRoutineNotificationWriter,
  ROUTINE_NOTIFICATION_SOURCE,
  buildRoutineNotificationRequestedOutboxInput,
} from '../server/infrastructure/routine-schedule/routine-occurrence-notification-writer';
export {
  PrismaRoutineOccurrenceNotificationWriter,
  mapSharedOutboxRowToReceipt,
} from '../server/infrastructure/routine-schedule/routine-occurrence-notification-writer.prisma';
export {
  createRoutinePrismaScheduleExecutionDeps,
} from '../server/infrastructure/routine-schedule/routine-schedule-execution-source.prisma';
export {
  PrismaRoutineTemporaryOverrideStore,
} from '../server/infrastructure/routine-schedule/routine-temporary-override-store.prisma';
export type {
  RoutineOccurrenceClaimInput,
  RoutineOccurrenceCommitInput,
  RoutineOccurrenceLease,
  RoutineOccurrenceStore,
  RoutineOccurrenceTransactionHandle,
  RoutineTerminalStatus,
  RoutineHistoryEntry,
} from '../server/domain/ports/routine-occurrence-store.port';
export type {
  RoutineOccurrenceNotificationWriterPort,
  RoutineOccurrenceNotificationRequestInput,
} from '../server/domain/ports/routine-occurrence-notification-writer.port';
export type {
  RoutineTemporaryOverrideStore,
} from '../server/domain/ports/routine-temporary-override-store.port';
