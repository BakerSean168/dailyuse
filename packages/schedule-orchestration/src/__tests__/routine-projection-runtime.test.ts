import { describe, expect, it, vi } from 'vitest';
import type {
  ScheduledIntent,
  SchedulingOwner,
  SchedulingPort,
  SchedulingReconcileReceipt,
} from '@memoflow/contracts/schedule';
import type {
  RoutineOccurrenceCommittedEvent,
  RoutineScheduleProjectionEventMap,
  RoutineScheduleProjectionSource,
} from '@memoflow/reminder/schedule-projection/routine';
import type { Subscriber } from '@memoflow/utils/domain';
import { createRoutineProjectionRuntime } from '../runtime/routine-projection-runtime';

function owner(id = 'RoutineId_fixture-f'): SchedulingOwner {
  return { identityId: 'IdentityId_fixture-f', type: 'routine.routine', id };
}

function intent(key = 'intent-1'): ScheduledIntent<Record<string, unknown>> {
  return {
    schedulingKey: key,
    handlerKey: 'routine.wallclock.fire',
    runAt: Date.parse('2026-08-25T15:30:00.000Z'),
    payloadVersion: 1,
    payload: {},
    sourceRevision: 3,
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

function createSchedulingPortHarness(): {
  port: SchedulingPort;
  reconciles: Array<{ owner: SchedulingOwner; desired: readonly ScheduledIntent[] }>;
  removals: SchedulingOwner[];
} {
  const reconciles: Array<{ owner: SchedulingOwner; desired: readonly ScheduledIntent[] }> = [];
  const removals: SchedulingOwner[] = [];
  return {
    port: {
      async reconcile(target, desired) {
        reconciles.push({ owner: target, desired });
        return receipt(target, desired.length);
      },
      async removeOwner(target) {
        removals.push(target);
        return receipt(target, 0);
      },
    },
    reconciles,
    removals,
  };
}

function createRoutineEventsHarness(): {
  subscriber: Subscriber<RoutineScheduleProjectionEventMap>;
  emit(event: 'routine:occurrence-committed', payload: RoutineOccurrenceCommittedEvent): Promise<void>;
} {
  const handlers = new Map<
    'routine:occurrence-committed',
    Set<(payload: RoutineOccurrenceCommittedEvent) => void | Promise<void>>
  >();

  return {
    subscriber: {
      on(event, handler) {
        const existing = handlers.get(event) ?? new Set();
        existing.add(handler);
        handlers.set(event, existing);
      },
      off(event, handler) {
        handlers.get(event)?.delete(handler);
      },
    },
    async emit(event, payload) {
      const activeHandlers = Array.from(handlers.get(event) ?? []);
      await Promise.all(activeHandlers.map((handler) => handler(payload)));
    },
  };
}

function sourceWithPlan(
  overrides: Partial<RoutineScheduleProjectionSource> = {},
): RoutineScheduleProjectionSource {
  return {
    buildRoutinePlan: vi.fn(async (routineId, identityId) => ({
      owner: { identityId, type: 'routine.routine', id: routineId },
      desired: [intent()],
    })),
    buildRoutineOwner: vi.fn((routineId, identityId) => ({
      identityId,
      type: 'routine.routine',
      id: routineId,
    })),
    ...overrides,
  };
}

describe('routine projection runtime -> SchedulingPort (ROUTINE-3401)', () => {
  it('reconciles the next durable occurrence when an occurrence is committed', async () => {
    const routineEvents = createRoutineEventsHarness();
    const scheduling = createSchedulingPortHarness();
    const source = sourceWithPlan();
    const runtime = createRoutineProjectionRuntime({
      source,
      schedulingPort: scheduling.port,
      routineEvents: routineEvents.subscriber,
    });

    await runtime.start();
    await routineEvents.emit('routine:occurrence-committed', {
      routineId: 'RoutineId_fixture-f',
      identityId: 'IdentityId_fixture-f',
      occurrenceKey: 'routine:RoutineId_fixture-f:oc:1787671800000',
      scheduledFor: Date.parse('2026-08-25T15:30:00.000Z'),
    });

    expect(source.buildRoutinePlan).toHaveBeenCalledWith(
      'RoutineId_fixture-f',
      'IdentityId_fixture-f',
    );
    expect(scheduling.reconciles).toEqual([{ owner: owner(), desired: [intent()] }]);
    await runtime.stop();
  });

  it('repairs lost events by reconciling every routine ref on startup', async () => {
    const routineEvents = createRoutineEventsHarness();
    const scheduling = createSchedulingPortHarness();
    const source = sourceWithPlan({
      listRoutineRefs: vi.fn().mockResolvedValue([
        { routineId: 'routine-1', identityId: 'identity-1' },
        { routineId: 'routine-2', identityId: 'identity-1' },
      ]),
    });
    const runtime = createRoutineProjectionRuntime({
      source,
      schedulingPort: scheduling.port,
      routineEvents: routineEvents.subscriber,
    });

    await runtime.start();

    expect(source.listRoutineRefs).toHaveBeenCalledTimes(1);
    expect(source.buildRoutinePlan).toHaveBeenCalledWith('routine-1', 'identity-1');
    expect(source.buildRoutinePlan).toHaveBeenCalledWith('routine-2', 'identity-1');
    expect(scheduling.reconciles.map((entry) => entry.owner.id)).toEqual(['routine-1', 'routine-2']);

    await runtime.stop();
  });

  it('skips startup reconcile when the source exposes no enumeration', async () => {
    const routineEvents = createRoutineEventsHarness();
    const scheduling = createSchedulingPortHarness();
    const source = sourceWithPlan();
    const runtime = createRoutineProjectionRuntime({
      source,
      schedulingPort: scheduling.port,
      routineEvents: routineEvents.subscriber,
    });

    await runtime.start();

    expect(source.buildRoutinePlan).not.toHaveBeenCalled();
    expect(scheduling.reconciles).toEqual([]);

    await runtime.stop();
  });
});