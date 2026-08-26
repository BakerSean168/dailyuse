/**
 * Routine (ROUTINE-3401) wall-clock projection lane (narrow seam).
 *
 * Narrow sub-path that avoids dragging the Reminder compose roots (Prisma,
 * PowerSync) into orchestrators that only join the durable Routine recurrence
 * projection. The full seam at ./index.ts continues to export both lanes.
 */
import './routine-event-registry.augment';
export {
  routineScheduleProjectionEventNames,
  createRoutineScheduleProjectionEventHandlers,
  createRoutineScheduleProjectionSource,
} from '../server/infrastructure/routine-schedule/routine-schedule-projection-source';
export {
  createRoutinePrismaScheduleProjectionSource,
} from '../server/infrastructure/routine-schedule/routine-schedule-projection-source.prisma';
export {
  createPrismaRoutineScheduleStateReader,
} from '../server/infrastructure/routine-schedule/routine-schedule-state-reader.prisma';
export type {
  RoutineOccurrenceCommittedEvent,
  RoutineScheduleProjectionEventMap,
  RoutineScheduleProjectionHandlers,
  RoutineScheduleProjectionPlan,
  RoutineScheduleProjectionSource,
  RoutineScheduleSnapshot,
  RoutineScheduleStateReader,
} from '../server/infrastructure/routine-schedule/routine-schedule-projection-source';