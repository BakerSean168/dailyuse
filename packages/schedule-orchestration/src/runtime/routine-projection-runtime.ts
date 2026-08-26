import type { SchedulingPort } from '@memoflow/contracts/schedule';
import {
  createRoutineScheduleProjectionEventHandlers,
  routineScheduleProjectionEventNames,
  type RoutineScheduleProjectionEventMap,
  type RoutineScheduleProjectionSource,
} from '@memoflow/reminder/schedule-projection/routine';
import type { Subscriber } from '@memoflow/utils/domain';
import { createLogger } from '@memoflow/utils/logger';
import type { RuntimeContribution } from '../ports/runtime-contribution';
import { createRoutineProjector } from '../projectors/routine-projector';

const logger = createLogger('RoutineProjectionRuntime');

export interface CreateRoutineProjectionRuntimeDeps {
  readonly source: RoutineScheduleProjectionSource;
  readonly schedulingPort: SchedulingPort;
  readonly routineEvents: Subscriber<RoutineScheduleProjectionEventMap>;
}

export function createRoutineProjectionRuntime(
  deps: CreateRoutineProjectionRuntimeDeps,
): RuntimeContribution {
  const projector = createRoutineProjector({
    source: deps.source,
    schedulingPort: deps.schedulingPort,
  });

  const handlers = createRoutineScheduleProjectionEventHandlers(projector);
  const eventName = routineScheduleProjectionEventNames[0];
  let started = false;

  /** Startup source-of-truth reconcile repairs occurrences committed while the host was down. */
  async function reconcile(): Promise<void> {
    if (!deps.source.listRoutineRefs) {
      logger.warn('[RoutineProjection] Source has no listRoutineRefs; skip initial reconcile');
      return;
    }
    const refs = await deps.source.listRoutineRefs();
    for (const ref of refs) {
      await projector.upsertRoutine(ref.routineId, ref.identityId);
    }
    logger.info(`[RoutineProjection] Initial reconcile complete (${refs.length} routines)`);
  }

  return {
    async start(): Promise<void> {
      if (started) return;

      // Register before full reconcile so occurrences committed during startup are not lost.
      deps.routineEvents.on(eventName, handlers[eventName]);

      await reconcile();
      started = true;
    },

    async stop(): Promise<void> {
      if (!started) return;

      deps.routineEvents.off(eventName, handlers[eventName]);
      started = false;
    },
  };
}