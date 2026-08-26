/**
 * ROUTINE-3401 Routine wall-clock execution lane (narrow seam).
 *
 * Narrow sub-path that avoids dragging the Reminder compose roots (Prisma,
 * PowerSync, module runtime) into orchestrators that only join the durable
 * Routine execution fence.
 */
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
  createInMemoryRoutineOccurrenceStore,
} from '../server/infrastructure/routine-schedule/routine-occurrence-store.in-memory';
export {
  createInMemoryRoutineNotificationWriter,
  ROUTINE_NOTIFICATION_SOURCE,
  buildRoutineNotificationRequestedOutboxInput,
} from '../server/infrastructure/routine-schedule/routine-occurrence-notification-writer';
export type {
  RoutineOccurrenceClaimInput,
  RoutineOccurrenceCommitInput,
  RoutineHistoryEntry,
  RoutineOccurrenceLease,
  RoutineOccurrenceStore,
  RoutineTerminalStatus,
} from '../server/domain/ports/routine-occurrence-store.port';
export type {
  RoutineOccurrenceNotificationWriterPort,
  RoutineOccurrenceNotificationRequestInput,
} from '../server/domain/ports/routine-occurrence-notification-writer.port';