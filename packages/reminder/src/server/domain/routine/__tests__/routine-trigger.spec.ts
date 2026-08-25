import { describe, expect, it, vi } from 'vitest';
import { ReminderType } from '@memoflow/contracts/reminder';
import { IdentityId } from '@memoflow/domain-shared';
import { ReminderTemplate } from '../../aggregates/reminder-template';
import {
  asInstant,
  type RecurrenceEnginePort,
} from '@memoflow/time';
import {
  adaptLegacyReminderTrigger,
  createActiveUsageTrigger,
  createElapsedTrigger,
  createSnoozeOverride,
  createTemporaryOverride,
  createWallClockTrigger,
  migrateLegacyFixedTimeTrigger,
  migrateLegacyIntervalTrigger,
  nextWallClockOccurrence,
  requiresDurableScheduleProjection,
  ROUTINE_TRIGGER_TYPES,
  RoutineDefinition,
  temporaryOverrideAllowsExecution,
  timingOwnerOf,
  wallClockOccurrencesBetween,
} from '..';

function createLegacyTemplate(input: {
  type?: (typeof ReminderType)[keyof typeof ReminderType];
  trigger: {
    type: 'FixedTime' | 'Interval';
    fixedTime: { time: string; timezone: string | null } | null;
    interval: { minutes: number; startTime: number | null } | null;
  };
  activatedAt: number;
}) {
  return ReminderTemplate.create({
    identityId: IdentityId.generate(),
    title: 'Legacy Routine',
    type: input.type ?? ReminderType.Recurring,
    trigger: input.trigger,
    activeTime: { activatedAt: input.activatedAt },
    notificationConfig: {
      channels: ['InApp'],
      title: null,
      body: null,
      sound: null,
      vibration: null,
      actions: null,
    },
  });
}

describe('Routine canonical trigger model', () => {
  it('has exactly WallClock / Elapsed / ActiveUsage and keeps Protocol out of Trigger', () => {
    expect(ROUTINE_TRIGGER_TYPES).toEqual(['WallClock', 'Elapsed', 'ActiveUsage']);
    expect(ROUTINE_TRIGGER_TYPES).not.toContain('Protocol' as never);
  });

  it('builds WallClock from product time primitives and rejects invalid local time/timezone', () => {
    const trigger = createWallClockTrigger({
      localTime: '15:00',
      timeZone: 'Asia/Tokyo',
      recurrence: {
        startDate: '2026-08-25',
        frequency: 'daily',
      },
    });

    expect(trigger).toMatchObject({
      type: 'WallClock',
      timingOwner: 'scheduler',
      localTime: '15:00',
      timeZone: 'Asia/Tokyo',
      recurrence: {
        startDate: '2026-08-25',
        frequency: 'daily',
        interval: 1,
        byWeekday: [],
        count: null,
        until: null,
      },
    });

    expect(() => createWallClockTrigger({
      localTime: '25:00',
      timeZone: 'Asia/Tokyo',
      recurrence: { startDate: '2026-08-25', frequency: 'daily' },
    })).toThrow('Invalid local time');
    expect(() => createWallClockTrigger({
      localTime: '15:00',
      timeZone: 'local',
      recurrence: { startDate: '2026-08-25', frequency: 'daily' },
    })).toThrow('Invalid IANA time zone');
  });

  it('delegates WallClock occurrence calculation to RecurrenceEnginePort without owning recurrence math', () => {
    const expectedNext = asInstant(Date.parse('2026-08-26T06:00:00.000Z'));
    const expectedBetween = [
      expectedNext,
      asInstant(Date.parse('2026-08-27T06:00:00.000Z')),
    ];
    const next = vi.fn(() => expectedNext);
    const between = vi.fn(() => expectedBetween);
    const engine: RecurrenceEnginePort = { next, between };
    const trigger = createWallClockTrigger({
      localTime: '15:00',
      timeZone: 'Asia/Tokyo',
      recurrence: {
        startDate: '2026-08-25',
        frequency: 'daily',
        interval: 1,
      },
    });
    const after = asInstant(Date.parse('2026-08-25T07:00:00.000Z'));
    const to = asInstant(Date.parse('2026-08-28T00:00:00.000Z'));

    expect(nextWallClockOccurrence(engine, trigger, after)).toBe(expectedNext);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: '2026-08-25',
        localTime: '15:00',
        timeZone: 'Asia/Tokyo',
        frequency: 'daily',
      }),
      after,
      false,
    );

    expect(wallClockOccurrencesBetween(engine, trigger, { from: after, to, inclusive: true }))
      .toEqual(expectedBetween);
    expect(between).toHaveBeenCalledWith(
      expect.objectContaining({ localTime: '15:00', timeZone: 'Asia/Tokyo' }),
      { from: after, to, inclusive: true },
    );
  });

  it('encodes timing ownership so only WallClock can become a durable Schedule projection', () => {
    const wallClock = createWallClockTrigger({
      localTime: '07:30',
      timeZone: 'Asia/Shanghai',
      recurrence: { startDate: '2026-08-25', frequency: 'daily' },
    });
    const elapsed = createElapsedTrigger({ durationMs: 60 * 60_000 });
    const activeUsage = createActiveUsageTrigger({
      requiredActiveMs: 40 * 60_000,
      naturalBreakCredit: { idleDurationMs: 5 * 60_000 },
    });

    expect(timingOwnerOf(wallClock)).toBe('scheduler');
    expect(requiresDurableScheduleProjection(wallClock)).toBe(true);
    expect(timingOwnerOf(elapsed)).toBe('local-runtime');
    expect(requiresDurableScheduleProjection(elapsed)).toBe(false);
    expect(timingOwnerOf(activeUsage)).toBe('local-runtime');
    expect(requiresDurableScheduleProjection(activeUsage)).toBe(false);
    expect(activeUsage.naturalBreakCredit).toEqual({
      idleDurationMs: 5 * 60_000,
      effect: 'satisfy-and-reset',
    });
  });

  it('stores the trigger on RoutineDefinition as domain truth', () => {
    const elapsed = createElapsedTrigger({ durationMs: 40 * 60_000 });
    const routine = RoutineDefinition.create({
      id: 'hydrate',
      identityId: 'identity-1',
      name: 'Hydrate',
      trigger: elapsed,
    });

    expect(routine.trigger).toBe(elapsed);
    const initialVersion = routine.version;
    const activeUsage = createActiveUsageTrigger({ requiredActiveMs: 40 * 60_000 });
    routine.setTrigger(activeUsage, new Date('2026-08-25T16:00:00.000Z'));
    expect(routine.trigger).toBe(activeUsage);
    expect(routine.version).toBe(initialVersion + 1);
  });

  it('models snooze as temporary state without rewriting the long-lived WallClock rule', () => {
    const trigger = createWallClockTrigger({
      localTime: '23:30',
      timeZone: 'Asia/Shanghai',
      recurrence: { startDate: '2026-08-25', frequency: 'daily' },
    });
    const originalLocalTime = trigger.localTime;
    const now = asInstant(Date.parse('2026-08-25T15:30:00.000Z'));
    const override = createSnoozeOverride({
      now,
      durationMs: 20 * 60_000,
      reason: 'Play 20 more minutes',
    });

    expect(temporaryOverrideAllowsExecution(override, now)).toBe(false);
    expect(temporaryOverrideAllowsExecution(
      override,
      asInstant(Number(now) + 20 * 60_000),
    )).toBe(true);
    expect(trigger.localTime).toBe(originalLocalTime);
    expect(trigger.localTime).toBe('23:30');
  });

  it('rejects temporary overrides whose effect outlives expiry or has no effect', () => {
    const now = asInstant(Date.parse('2026-08-25T15:30:00.000Z'));
    expect(() => createTemporaryOverride({
      snoozeUntil: asInstant(Number(now) + 30 * 60_000),
      expiresAt: asInstant(Number(now) + 20 * 60_000),
      reason: 'invalid snooze',
      source: 'user',
    })).toThrow('snoozeUntil must not exceed expiresAt');
    expect(() => createTemporaryOverride({
      expiresAt: asInstant(Number(now) + 20 * 60_000),
      reason: 'no-op',
      source: 'runtime',
    })).toThrow('must define at least one temporary effect');
  });

  it('maps legacy FixedTime to WallClock with explicit UTC for the old null-timezone contract', () => {
    const trigger = migrateLegacyFixedTimeTrigger({
      legacy: { time: '12:00', timezone: null },
      recurrence: {
        startDate: '2026-08-25',
        frequency: 'daily',
      },
    });

    expect(trigger.type).toBe('WallClock');
    expect(trigger.timeZone).toBe('UTC');
    expect(trigger.localTime).toBe('12:00');
  });

  it('adapts actual legacy FixedTime behavior: recurring=daily and one-time=count 1', () => {
    const activatedAt = Date.parse('2026-08-25T16:30:00.000Z'); // 2026-08-26 in Tokyo
    const recurring = adaptLegacyReminderTrigger(createLegacyTemplate({
      activatedAt,
      trigger: {
        type: 'FixedTime',
        fixedTime: { time: '07:30', timezone: 'Asia/Tokyo' },
        interval: null,
      },
    }));
    const oneTime = adaptLegacyReminderTrigger(createLegacyTemplate({
      type: ReminderType.OneTime,
      activatedAt,
      trigger: {
        type: 'FixedTime',
        fixedTime: { time: '07:30', timezone: 'Asia/Tokyo' },
        interval: null,
      },
    }));

    expect(recurring.trigger).toMatchObject({
      type: 'WallClock',
      recurrence: { startDate: '2026-08-26', frequency: 'daily', count: null },
    });
    expect(oneTime.trigger).toMatchObject({
      type: 'WallClock',
      recurrence: { startDate: '2026-08-26', frequency: 'daily', count: 1 },
    });
  });

  it('uses activeTime.activatedAt as the real legacy Interval anchor and does not invent OneTime Interval behavior', () => {
    const activatedAt = Date.parse('2026-08-25T08:00:00.000Z');
    const ignoredIntervalStartTime = Date.parse('2026-08-24T08:00:00.000Z');
    const recurring = adaptLegacyReminderTrigger(createLegacyTemplate({
      activatedAt,
      trigger: {
        type: 'Interval',
        fixedTime: null,
        interval: { minutes: 40, startTime: ignoredIntervalStartTime },
      },
    }));
    const oneTime = adaptLegacyReminderTrigger(createLegacyTemplate({
      type: ReminderType.OneTime,
      activatedAt,
      trigger: {
        type: 'Interval',
        fixedTime: null,
        interval: { minutes: 40, startTime: ignoredIntervalStartTime },
      },
    }));

    expect(recurring.trigger).toMatchObject({ type: 'Elapsed', durationMs: 40 * 60_000 });
    expect(Number(recurring.legacyRuntimeAnchor)).toBe(activatedAt);
    expect(Number(recurring.legacyRuntimeAnchor)).not.toBe(ignoredIntervalStartTime);
    expect(oneTime.trigger).toBeNull();
    expect(oneTime.rationale).toContain('does not invent new behavior');
  });

  it('classifies legacy Interval as Elapsed by default and only ActiveUsage with explicit evidence', () => {
    const startTime = Date.parse('2026-08-25T08:00:00.000Z');
    const elapsed = migrateLegacyIntervalTrigger({ minutes: 40, startTime });
    const active = migrateLegacyIntervalTrigger(
      { minutes: 40, startTime },
      {
        semanticEvidence: 'active-usage',
        naturalBreakCreditMs: 5 * 60_000,
      },
    );

    expect(elapsed.target).toBe('Elapsed');
    expect(elapsed.trigger).toMatchObject({
      type: 'Elapsed',
      timingOwner: 'local-runtime',
      durationMs: 40 * 60_000,
    });
    expect(Number(elapsed.legacyAnchorInstant)).toBe(startTime);
    expect(active.target).toBe('ActiveUsage');
    expect(active.trigger).toMatchObject({
      type: 'ActiveUsage',
      timingOwner: 'local-runtime',
      requiredActiveMs: 40 * 60_000,
      naturalBreakCredit: {
        idleDurationMs: 5 * 60_000,
        effect: 'satisfy-and-reset',
      },
    });
  });
});
