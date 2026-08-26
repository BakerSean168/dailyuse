import { describe, expect, it } from 'vitest';
import { createRecurrenceEngine } from '@memoflow/time';
import {
  createRoutineScheduleProjectionSource,
  type RoutineScheduleProjectionSource,
  type RoutineScheduleStateReader,
} from '../routine-schedule-projection-source';
import {
  ROUTINE_SCHEDULING_OWNER_TYPE,
  ROUTINE_WALLCLOCK_HANDLER_KEY,
  ROUTINE_WALLCLOCK_PAYLOAD_VERSION,
  buildRoutineWallClockSchedulingKey,
} from '../routine-schedule-contract';
import { createElapsedTrigger } from '../../../domain/routine';
import {
  FIXTURE_F,
  buildFixtureFRoutine,
  fixtureOccurrenceKey,
  fixtureTrigger,
} from './test-support';

function createReader(options?: {
  snapshot?: { definition: ReturnType<typeof buildFixtureFRoutine> } | null;
}): RoutineScheduleStateReader {
  return {
    async readRoutineScheduleSnapshot() {
      return options?.snapshot === undefined
        ? { definition: buildFixtureFRoutine() }
        : options.snapshot;
    },
  };
}

function createSource(
  reader: RoutineScheduleStateReader,
  options?: { now?: number },
): RoutineScheduleProjectionSource {
  return createRoutineScheduleProjectionSource({
    reader,
    recurrenceEngine: createRecurrenceEngine(),
    now: () => options?.now ?? Date.parse('2026-08-25T07:00:00.000Z'),
  });
}

describe('createRoutineScheduleProjectionSource (ROUTINE-3401)', () => {
  it('projects exactly one durable intent at the canonical 23:30 Asia/Shanghai instant', async () => {
    const source = createSource(createReader());
    const plan = await source.buildRoutinePlan(FIXTURE_F.routineId, FIXTURE_F.identityId);

    expect(plan.owner.type).toBe(ROUTINE_SCHEDULING_OWNER_TYPE);
    expect(plan.owner.id).toBe(FIXTURE_F.routineId);
    expect(plan.desired).toHaveLength(1);

    const intent = plan.desired[0];
    expect(intent.handlerKey).toBe(ROUTINE_WALLCLOCK_HANDLER_KEY);
    expect(intent.payloadVersion).toBe(ROUTINE_WALLCLOCK_PAYLOAD_VERSION);
    expect(intent.runAt).toBe(FIXTURE_F.firstOccurrenceAt);
    expect(intent.schedulingKey).toBe(
      buildRoutineWallClockSchedulingKey(FIXTURE_F.routineId, fixtureOccurrenceKey()),
    );
    expect(intent.payload).toEqual({
      routineId: FIXTURE_F.routineId,
      identityId: FIXTURE_F.identityId,
      occurrenceKey: fixtureOccurrenceKey(),
      scheduledFor: FIXTURE_F.firstOccurrenceAt,
      sourceRevision: FIXTURE_F.version,
    });
  });

  it('projects nothing for a disabled routine (owner key stays canonical)', async () => {
    const source = createSource(
      createReader({ snapshot: { definition: buildFixtureFRoutine({ enabled: false }) } }),
    );
    const plan = await source.buildRoutinePlan(FIXTURE_F.routineId, FIXTURE_F.identityId);
    expect(plan.desired).toEqual([]);
    expect(plan.owner.id).toBe(FIXTURE_F.routineId);
  });

  it('projects nothing for local-runtime triggers (Elapsed stays Wave 4)', async () => {
    const source = createSource(
      createReader({
        snapshot: {
          definition: buildFixtureFRoutine({ trigger: createElapsedTrigger({ durationMs: 60_000 }) }),
        },
      }),
    );
    const plan = await source.buildRoutinePlan(FIXTURE_F.routineId, FIXTURE_F.identityId);
    expect(plan.desired).toEqual([]);
  });

  it('projects nothing when the snapshot is missing', async () => {
    const source = createSource(createReader({ snapshot: null }));
    const plan = await source.buildRoutinePlan(FIXTURE_F.routineId, FIXTURE_F.identityId);
    expect(plan.desired).toEqual([]);
  });

  it('projects nothing once the recurrence count is exhausted', async () => {
    const source = createSource(
      createReader({
        snapshot: {
          definition: buildFixtureFRoutine({ trigger: fixtureTrigger({ count: 1 }) }),
        },
      }),
      { now: Date.parse('2026-08-26T00:00:00.000Z') },
    );
    const plan = await source.buildRoutinePlan(FIXTURE_F.routineId, FIXTURE_F.identityId);
    expect(plan.desired).toEqual([]);
  });
});