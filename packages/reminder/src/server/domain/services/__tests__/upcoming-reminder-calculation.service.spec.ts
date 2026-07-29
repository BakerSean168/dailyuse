import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReminderTemplateServerDTO } from '@memoflow/contracts/reminder';
import {
  NotificationChannel,
  ReminderStatus,
  ReminderType,
  TriggerType,
} from '@memoflow/contracts/reminder';
import { ImportanceLevel } from '@memoflow/contracts/shared';
import { UpcomingReminderCalculationService } from '../upcoming-reminder-calculation-service';

function createReminder(
  overrides: Partial<ReminderTemplateServerDTO>,
): ReminderTemplateServerDTO {
  return {
    id: 'reminder-template-id' as ReminderTemplateServerDTO['id'],
    identityId: 'identity-id',
    name: '提醒',
    description: null,
    type: ReminderType.Recurring,
    trigger: {
      type: TriggerType.FixedTime,
      fixedTime: { time: '09:00', timezone: null },
      interval: null,
    },
    activeTime: {
      activatedAt: Date.parse('2026-03-01T00:00:00.000Z'),
    },
    activeHours: null,
    notificationConfig: {
      channels: [NotificationChannel.InApp],
      title: null,
      body: null,
      sound: null,
      vibration: null,
      actions: null,
    },
    selfEnabled: true,
    status: ReminderStatus.Active,
    groupId: null,
    importanceLevel: ImportanceLevel.Moderate,
    tags: [],
    color: '#16A34A',
    icon: 'figure-walking',
    nextTriggerAt: null,
    version: 1,
    createdAt: Date.parse('2026-03-01T00:00:00.000Z'),
    updatedAt: Date.parse('2026-03-01T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

describe('UpcomingReminderCalculationService.calculateTodaySchedule', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns every trigger point for today and keeps them ordered', () => {
    vi.setSystemTime(new Date('2026-03-29T00:00:00.000Z'));

    const schedule = UpcomingReminderCalculationService.calculateTodaySchedule(
      [
        createReminder({
          id: 'walk-template' as ReminderTemplateServerDTO['id'],
          name: '起来走走',
          trigger: {
            type: TriggerType.Interval,
            fixedTime: null,
            interval: {
              minutes: 280,
              startTime: null,
            },
          },
          activeTime: {
            activatedAt: Date.parse('2026-03-29T01:40:00.000Z'),
          },
        }),
        createReminder({
          id: 'lunch-template' as ReminderTemplateServerDTO['id'],
          name: '吃午饭',
          trigger: {
            type: TriggerType.FixedTime,
            fixedTime: { time: '11:40', timezone: null },
            interval: null,
          },
        }),
      ],
      { includeExpired: true },
    );

    expect(schedule.map((item) => item.title)).toEqual([
      '起来走走',
      '吃午饭',
      '起来走走',
      '起来走走',
      '起来走走',
    ]);
    expect(schedule.map((item) => item.nextTriggerAt)).toEqual([
      Date.parse('2026-03-29T01:40:00.000Z'),
      Date.parse('2026-03-29T03:40:00.000Z'),
      Date.parse('2026-03-29T06:20:00.000Z'),
      Date.parse('2026-03-29T11:00:00.000Z'),
      Date.parse('2026-03-29T15:40:00.000Z'),
    ]);
  });

  it('filters out past trigger points by default', () => {
    vi.setSystemTime(new Date('2026-03-29T04:00:00.000Z'));

    const schedule = UpcomingReminderCalculationService.calculateTodaySchedule(
      [
        createReminder({
          id: 'walk-template' as ReminderTemplateServerDTO['id'],
          name: '起来走走',
          trigger: {
            type: TriggerType.Interval,
            fixedTime: null,
            interval: {
              minutes: 280,
              startTime: null,
            },
          },
          activeTime: {
            activatedAt: Date.parse('2026-03-29T01:40:00.000Z'),
          },
        }),
        createReminder({
          id: 'lunch-template' as ReminderTemplateServerDTO['id'],
          name: '吃午饭',
          trigger: {
            type: TriggerType.FixedTime,
            fixedTime: { time: '11:40', timezone: null },
            interval: null,
          },
        }),
      ],
    );

    expect(schedule.map((item) => item.title)).toEqual(['起来走走', '起来走走', '起来走走']);
    expect(schedule.map((item) => item.nextTriggerAt)).toEqual([
      Date.parse('2026-03-29T06:20:00.000Z'),
      Date.parse('2026-03-29T11:00:00.000Z'),
      Date.parse('2026-03-29T15:40:00.000Z'),
    ]);
  });

  it('moves a recurring fixed-time reminder to the next cycle when today\'s time has passed', () => {
    const afterTime = Date.parse('2026-03-29T10:00:00.000Z');

    const nextTrigger = UpcomingReminderCalculationService.calculateNextTriggerTime(
      createReminder({
        trigger: {
          type: TriggerType.FixedTime,
          fixedTime: { time: '09:00', timezone: null },
          interval: null,
        },
      }),
      afterTime,
    );

    const expectedNextCycle = new Date(afterTime);
    expectedNextCycle.setDate(expectedNextCycle.getDate() + 1);
    expectedNextCycle.setHours(9, 0, 0, 0);
    expect(nextTrigger).toBe(expectedNextCycle.getTime());
  });
});
