import { createLogger } from '@memoflow/utils/logger';
import { TaskGoalOutboxDispatcher } from '../application/outbox/task-goal-outbox-dispatcher';
import type { TaskModuleRuntimeContribution } from './task.module';

const logger = createLogger('TaskGoalOutboxRuntime');

export interface TaskGoalOutboxRuntimeOptions {
  readonly intervalMs?: number;
  readonly batchSize?: number;
}

/** Polls durable Task -> Goal work without allowing overlapping claims. */
export function createTaskGoalOutboxRuntime(
  dispatcher: TaskGoalOutboxDispatcher,
  options: TaskGoalOutboxRuntimeOptions = {},
): TaskModuleRuntimeContribution {
  const intervalMs = options.intervalMs ?? 2_000;
  const batchSize = options.batchSize ?? 100;
  let timer: ReturnType<typeof setInterval> | null = null;
  let dispatching = false;

  const dispatch = async (): Promise<void> => {
    if (dispatching) return;
    dispatching = true;
    try {
      await dispatcher.dispatchPending(batchSize);
    } catch (error) {
      logger.error('[TaskGoalOutboxRuntime] Dispatch cycle failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      dispatching = false;
    }
  };

  return {
    async start(): Promise<void> {
      if (timer) return;
      void dispatch();
      timer = setInterval(() => void dispatch(), intervalMs);
      timer.unref?.();
    },
    async stop(): Promise<void> {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    },
  };
}
