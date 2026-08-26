import type { SchedulingPort } from '@memoflow/contracts/schedule';
import {
  createGoalScheduleProjectionEventHandlers,
  type GoalScheduleProjectionEventMap,
  type GoalScheduleProjectionSource,
} from '@memoflow/goal/schedule-projection';
import type { Subscriber } from '@memoflow/utils/domain';
import { createLogger } from '@memoflow/utils/logger';
import type { RuntimeContribution } from '../ports/runtime-contribution';
import { createGoalProjector } from '../projectors/goal-projector';

const logger = createLogger('GoalProjectionRuntime');

export interface CreateGoalProjectionRuntimeDeps {
  readonly source: GoalScheduleProjectionSource;
  readonly schedulingPort: SchedulingPort;
  readonly goalEvents: Subscriber<GoalScheduleProjectionEventMap>;
}

export function createGoalProjectionRuntime(
  deps: CreateGoalProjectionRuntimeDeps,
): RuntimeContribution {
  const projector = createGoalProjector({
    source: deps.source,
    schedulingPort: deps.schedulingPort,
  });

  const handlers = createGoalScheduleProjectionEventHandlers(projector);
  let started = false;

  /** Startup source-of-truth reconcile repairs events missed while the host was down. */
  async function reconcile(): Promise<void> {
    if (!deps.source.listGoalRefs) {
      logger.warn('[GoalProjection] Source has no listGoalRefs; skip initial reconcile');
      return;
    }
    const refs = await deps.source.listGoalRefs();
    for (const ref of refs) {
      await projector.upsertGoal(ref.goalId, ref.identityId);
    }
    logger.info(`[GoalProjection] Initial reconcile complete (${refs.length} goals)`);
  }

  return {
    async start(): Promise<void> {
      if (started) return;

      // Register before full reconcile so events occurring during startup are not lost.
      deps.goalEvents.on('goal:created', handlers['goal:created']);
      deps.goalEvents.on('goal:updated', handlers['goal:updated']);
      deps.goalEvents.on('goal:schedule-time-changed', handlers['goal:schedule-time-changed']);
      deps.goalEvents.on('goal:reminder-config-changed', handlers['goal:reminder-config-changed']);
      deps.goalEvents.on('goal:completed', handlers['goal:completed']);
      deps.goalEvents.on('goal:archived', handlers['goal:archived']);
      deps.goalEvents.on('goal:deleted', handlers['goal:deleted']);

      await reconcile();
      started = true;
    },

    async stop(): Promise<void> {
      if (!started) return;

      deps.goalEvents.off('goal:created', handlers['goal:created']);
      deps.goalEvents.off('goal:updated', handlers['goal:updated']);
      deps.goalEvents.off('goal:schedule-time-changed', handlers['goal:schedule-time-changed']);
      deps.goalEvents.off('goal:reminder-config-changed', handlers['goal:reminder-config-changed']);
      deps.goalEvents.off('goal:completed', handlers['goal:completed']);
      deps.goalEvents.off('goal:archived', handlers['goal:archived']);
      deps.goalEvents.off('goal:deleted', handlers['goal:deleted']);

      started = false;
    },
  };
}
