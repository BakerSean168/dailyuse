import { describe, expect, it, vi } from 'vitest';
import { TaskGoalOutboxDispatcher } from './task-goal-outbox-dispatcher';

const pendingEvent = {
  eventId: 'event-1',
  payload: JSON.stringify({
    eventId: 'event-1',
    schemaVersion: 1 as const,
    eventType: 'task.goal-progress-requested' as const,
    identityId: 'identity-1' as never,
    taskInstanceId: 'instance-1' as never,
    taskTemplateId: 'template-1' as never,
    goalId: 'goal-1' as never,
    keyResultId: 'kr-1' as never,
    goalRecordValue: 1,
    progressTrigger: 'PER_INSTANCE' as const,
    taskTitle: 'Task',
    occurredAt: 1,
  }),
};

describe('TaskGoalOutboxDispatcher', () => {
  it('replays persisted pending events after restart and marks them delivered only after the Goal handler succeeds', async () => {
    const store = {
      claimPending: vi.fn(async () => [pendingEvent]),
      markDelivered: vi.fn(),
      markRetry: vi.fn(),
      replayDeadLetter: vi.fn(),
    };
    const handler = { handle: vi.fn(async () => {}) };

    await new TaskGoalOutboxDispatcher(store, handler).dispatchPending();

    expect(handler.handle).toHaveBeenCalledWith(JSON.parse(pendingEvent.payload));
    expect(store.markDelivered).toHaveBeenCalledWith('event-1');
    expect(store.markRetry).not.toHaveBeenCalled();
  });

  it('retries malformed persisted payloads instead of blocking the whole poll cycle', async () => {
    const malformed = { eventId: 'broken-1', payload: '{not-json' };
    const store = {
      claimPending: vi.fn(async () => [malformed, pendingEvent]),
      markDelivered: vi.fn(),
      markRetry: vi.fn(),
      replayDeadLetter: vi.fn(),
    };
    const handler = { handle: vi.fn(async () => {}) };

    await new TaskGoalOutboxDispatcher(store, handler).dispatchPending();

    expect(store.markRetry).toHaveBeenCalledWith('broken-1', expect.any(String));
    expect(store.markDelivered).toHaveBeenCalledWith('event-1');
    expect(handler.handle).toHaveBeenCalledTimes(1);
  });

  it('keeps the same eventId pending for retry when delivery fails', async () => {
    const store = {
      claimPending: vi.fn(async () => [pendingEvent]),
      markDelivered: vi.fn(),
      markRetry: vi.fn(),
      replayDeadLetter: vi.fn(),
    };
    const handler = {
      handle: vi.fn(async () => {
        throw new Error('Goal unavailable');
      }),
    };

    await new TaskGoalOutboxDispatcher(store, handler).dispatchPending();

    expect(store.markDelivered).not.toHaveBeenCalled();
    expect(store.markRetry).toHaveBeenCalledWith('event-1', 'Goal unavailable');
  });
});
