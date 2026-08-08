import type { TaskGoalProgressOutboxEventV1 } from '@memoflow/contracts/task';
import { TaskGoalBindingTrigger } from '@memoflow/contracts/task';
import { createLogger } from '@memoflow/utils/logger';

const logger = createLogger('TaskGoalOutboxDispatcher');

export interface PendingTaskGoalOutboxEvent {
  eventId: string;
  /** Raw persistence payload; decoded only at the application boundary. */
  payload: string;
}

/** Dedicated persistence port for Task → Goal delivery; not a generic bus. */
export interface TaskGoalOutboxDispatchStore {
  claimPending(limit: number): Promise<PendingTaskGoalOutboxEvent[]>;
  markDelivered(eventId: string): Promise<void>;
  markRetry(eventId: string, error: string): Promise<void>;
  replayDeadLetter(eventId: string): Promise<boolean>;
}

/** Goal's eventual handler will own idempotency keyed by eventId. */
export interface TaskGoalProgressHandler {
  handle(event: TaskGoalProgressOutboxEventV1): Promise<void>;
}

export class TaskGoalOutboxDispatcher {
  constructor(
    private readonly store: TaskGoalOutboxDispatchStore,
    private readonly handler: TaskGoalProgressHandler,
  ) {}

  async dispatchPending(limit = 100): Promise<void> {
    const pending = await this.store.claimPending(limit);
    if (pending.length > 0) {
      logger.info('[TaskGoalOutboxDispatcher] Claimed delivery batch', {
        count: pending.length,
      });
    }
    for (const event of pending) {
      try {
        await this.handler.handle(decodeTaskGoalProgressEvent(event.eventId, event.payload));
        await this.store.markDelivered(event.eventId);
        logger.info('[TaskGoalOutboxDispatcher] Delivery completed', {
          eventId: event.eventId,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await this.store.markRetry(event.eventId, message);
        logger.error('[TaskGoalOutboxDispatcher] Delivery scheduled for retry', {
          eventId: event.eventId,
          error: message,
        });
      }
    }
  }
}

function decodeTaskGoalProgressEvent(
  claimedEventId: string,
  serialized: string,
): TaskGoalProgressOutboxEventV1 {
  const value: unknown = JSON.parse(serialized);
  if (!isRecord(value)) throw new Error('Task -> Goal payload must be an object');
  if (value.eventId !== claimedEventId) throw new Error('Task -> Goal eventId mismatch');
  if (value.schemaVersion !== 1 || value.eventType !== 'task.goal-progress-requested') {
    throw new Error('Unsupported Task -> Goal event contract');
  }
  const stringFields = [
    'identityId',
    'taskInstanceId',
    'taskTemplateId',
    'goalId',
    'keyResultId',
    'taskTitle',
  ] as const;
  const action = value.action;
  if (action !== 'complete' && action !== 'uncomplete') {
    throw new Error('Task -> Goal payload contains an invalid action');
  }
  // uncomplete 撤销只需要 source 定位字段（goalId/keyResultId/taskTitle 为空串合法）。
  const requiredFields =
    action === 'uncomplete'
      ? (['identityId', 'taskInstanceId', 'taskTemplateId'] as const)
      : stringFields;
  if (requiredFields.some((field) => typeof value[field] !== 'string' || value[field].length === 0)) {
    throw new Error('Task -> Goal payload contains an invalid identifier or title');
  }
  if (!Number.isFinite(value.goalRecordValue) || !Number.isFinite(value.occurredAt)) {
    throw new Error('Task -> Goal payload contains an invalid numeric value');
  }
  if (!Object.values(TaskGoalBindingTrigger).includes(value.progressTrigger as never)) {
    throw new Error('Task -> Goal payload contains an invalid progress trigger');
  }
  return value as unknown as TaskGoalProgressOutboxEventV1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
