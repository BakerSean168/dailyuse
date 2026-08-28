import { describe, expect, it, vi } from 'vitest';
import type {
  ScheduledIntent,
  SchedulingOwner,
  SchedulingPort,
  SchedulingReconcileReceipt,
} from '@memoflow/contracts/schedule';
import type {
  GoalReminderScheduledPayload,
  GoalScheduleProjectionEventMap,
  GoalScheduleProjectionSource,
} from '@memoflow/goal/schedule-projection';
import type { Subscriber } from '@memoflow/utils/domain';
import { createGoalProjectionRuntime } from '../runtime/goal-projection-runtime';

function owner(id = 'GoalId_goal-1'): SchedulingOwner {
  return { identityId: 'IdentityId_goal-owner', type: 'goal', id };
}

function intent(): ScheduledIntent<GoalReminderScheduledPayload> {
  return {
    schedulingKey: 'sk:v1:test',
    handlerKey: 'goal.reminder.fire',
    runAt: Date.UTC(2030, 0, 13),
    payloadVersion: 1,
    payload: {
      goalId: 'GoalId_goal-1',
      goalName: 'Launch 1.0',
      triggerType: 'RemainingDays',
      triggerValue: 7,
      startDate: Date.UTC(2030, 0, 1),
      dueDate: Date.UTC(2030, 0, 20),
      reminderTime: Date.UTC(2030, 0, 13),
    },
  };
}

function receipt(target: SchedulingOwner, desiredCount: number): SchedulingReconcileReceipt {
  return {
    operationId: `op:${target.id}`,
    owner: target,
    status: 'succeeded',
    desiredCount,
    createdCount: desiredCount,
    updatedCount: 0,
    deletedCount: 0,
    unchangedCount: 0,
    startedAt: 1,
    finishedAt: 2,
  };
}

function schedulingHarness() {
  const reconciles: Array<{ owner: SchedulingOwner; desired: readonly ScheduledIntent[] }> = [];
  const removals: SchedulingOwner[] = [];
  const port: SchedulingPort = {
    async reconcile(target, desired) {
      reconciles.push({ owner: target, desired });
      return receipt(target, desired.length);
    },
    async removeOwner(target) {
      removals.push(target);
      return receipt(target, 0);
    },
  };
  return { port, reconciles, removals };
}

function eventHarness(): {
  subscriber: Subscriber<GoalScheduleProjectionEventMap>;
  emit<K extends keyof GoalScheduleProjectionEventMap>(
    event: K,
    payload: GoalScheduleProjectionEventMap[K],
  ): Promise<void>;
} {
  const handlers = new Map<
    keyof GoalScheduleProjectionEventMap,
    Set<(payload: GoalScheduleProjectionEventMap[keyof GoalScheduleProjectionEventMap]) => void | Promise<void>>
  >();
  return {
    subscriber: {
      on(event, handler) {
        const set = handlers.get(event) ?? new Set();
        set.add(handler as never);
        handlers.set(event, set);
      },
      off(event, handler) {
        handlers.get(event)?.delete(handler as never);
      },
    },
    async emit(event, payload) {
      await Promise.all(Array.from(handlers.get(event) ?? []).map((handler) => handler(payload)));
    },
  };
}

function source(overrides: Partial<GoalScheduleProjectionSource> = {}): GoalScheduleProjectionSource {
  return {
    buildGoalPlan: vi.fn(async (goalId, identityId) => ({
      owner: { identityId, type: 'goal', id: goalId },
      desired: [intent()],
    })),
    buildGoalOwner: vi.fn((goalId, identityId) => ({ identityId, type: 'goal', id: goalId })),
    ...overrides,
  };
}

describe('goal projection runtime -> SchedulingPort', () => {
  it('reconciles on Goal update/status changes', async () => {
    const events = eventHarness();
    const scheduling = schedulingHarness();
    const projection = source();
    const runtime = createGoalProjectionRuntime({
      source: projection,
      schedulingPort: scheduling.port,
      goalEvents: events.subscriber,
    });
    await runtime.start();

    await events.emit('goal:updated', {
      identityId: 'IdentityId_goal-owner',
      goal: { id: 'GoalId_goal-1' },
    } as never);
    await events.emit('goal:status-changed', {
      identityId: 'IdentityId_goal-owner',
      goal: { id: 'GoalId_goal-1' },
      previousStatus: 'Active',
      newStatus: 'Abandoned',
    } as never);

    expect(projection.buildGoalPlan).toHaveBeenCalledTimes(2);
    expect(scheduling.reconciles).toHaveLength(2);
    expect(scheduling.removals).toHaveLength(0);
  });

  it('removes the entire Goal owner on complete/archive/delete', async () => {
    const events = eventHarness();
    const scheduling = schedulingHarness();
    const projection = source();
    const runtime = createGoalProjectionRuntime({
      source: projection,
      schedulingPort: scheduling.port,
      goalEvents: events.subscriber,
    });
    await runtime.start();

    for (const event of ['goal:completed', 'goal:archived', 'goal:deleted'] as const) {
      await events.emit(event, {
        identityId: 'IdentityId_goal-owner',
        goal: { id: 'GoalId_goal-1' },
      } as never);
    }

    expect(scheduling.removals).toEqual([owner(), owner(), owner()]);
  });

  it('repairs lost events with startup reconcile and unsubscribes on stop', async () => {
    const events = eventHarness();
    const scheduling = schedulingHarness();
    const projection = source({
      listGoalRefs: vi.fn().mockResolvedValue([
        { goalId: 'GoalId_goal-1', identityId: 'IdentityId_goal-owner' },
        { goalId: 'GoalId_goal-2', identityId: 'IdentityId_goal-owner' },
      ]),
    });
    const runtime = createGoalProjectionRuntime({
      source: projection,
      schedulingPort: scheduling.port,
      goalEvents: events.subscriber,
    });

    await runtime.start();
    expect(scheduling.reconciles.map((entry) => entry.owner.id)).toEqual([
      'GoalId_goal-1',
      'GoalId_goal-2',
    ]);

    await runtime.stop();
    await events.emit('goal:updated', {
      identityId: 'IdentityId_goal-owner',
      goal: { id: 'GoalId_goal-1' },
    } as never);
    expect(scheduling.reconciles).toHaveLength(2);
  });
});
