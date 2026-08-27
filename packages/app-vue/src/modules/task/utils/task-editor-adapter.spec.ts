import { describe, expect, it } from 'vitest';
import { TaskTimeType } from '@memoflow/contracts/task';
import { asHm, asYmd } from '@memoflow/time';
import {
  recurrenceEditorToRule,
  recurrenceRuleToEditor,
  reminderConfigToOffsetMinutes,
  reminderOffsetMinutesToConfig,
  resolveTaskEditorTime,
  taskTimeConfigToEditor,
} from './task-editor-adapter';
import { getProductTime } from '../../../shared/utils/product-time';

describe('task editor adapters', () => {
  it('infers AllDay, TimePoint and TimeRange without a visible TaskTimeType control', () => {
    const date = asYmd('2026-08-30');
    const expectedStart = getProductTime().codec.startOfYmd(date);

    expect(resolveTaskEditorTime({ date, startTime: null, endTime: null })).toEqual({
      value: { timeType: TaskTimeType.AllDay, startDate: expectedStart, timePoint: null, timeRange: null },
      error: null,
    });
    expect(resolveTaskEditorTime({ date, startTime: asHm('09:30'), endTime: null })).toEqual({
      value: { timeType: TaskTimeType.TimePoint, startDate: expectedStart, timePoint: 570, timeRange: null },
      error: null,
    });
    expect(resolveTaskEditorTime({ date, startTime: asHm('09:30'), endTime: asHm('10:45') })).toEqual({
      value: { timeType: TaskTimeType.TimeRange, startDate: expectedStart, timePoint: null, timeRange: { start: 570, end: 645 } },
      error: null,
    });
  });

  it('rejects incomplete or reversed time ranges', () => {
    const date = asYmd('2026-08-30');
    expect(resolveTaskEditorTime({ date: null, startTime: null, endTime: null }).error).toBe('date-required');
    expect(resolveTaskEditorTime({ date, startTime: null, endTime: asHm('10:00') }).error).toBe('end-without-start');
    expect(resolveTaskEditorTime({ date, startTime: asHm('10:00'), endTime: asHm('09:00') }).error).toBe('end-before-start');
  });

  it('round-trips Task time through Product Time instead of Date parsing', () => {
    const date = asYmd('2026-03-08');
    const startDate = getProductTime().codec.startOfYmd(date);
    expect(taskTimeConfigToEditor({
      timeType: TaskTimeType.TimeRange,
      startDate,
      timePoint: null,
      timeRange: { start: 75, end: 150 },
    })).toEqual({ date, startTime: asHm('01:15'), endTime: asHm('02:30') });
  });

  it('adapts finite recurrence end dates and counts with Product Time', () => {
    const endDate = asYmd('2026-09-30');
    const rule = recurrenceEditorToRule({
      frequency: 'Weekly',
      interval: 2,
      daysOfWeek: [1, 3],
      endMode: 'date',
      endDate,
      occurrences: null,
    });
    expect(rule).toEqual({
      frequency: 'Weekly',
      interval: 2,
      daysOfWeek: [1, 3],
      endDate: getProductTime().codec.startOfYmd(endDate),
      occurrences: null,
    });
    expect(recurrenceRuleToEditor(rule)).toMatchObject({ endMode: 'date', endDate });

    expect(recurrenceEditorToRule({
      frequency: 'Daily', interval: 1, daysOfWeek: [1], endMode: 'count', endDate: null, occurrences: 15,
    })).toMatchObject({ daysOfWeek: [], endDate: null, occurrences: 15 });
  });

  it('uses the shared ReminderOffsetField value as a single relative reminder', () => {
    const config = reminderOffsetMinutesToConfig(90);
    expect(config).toEqual({
      enabled: true,
      triggers: [{ type: 'Relative', absoluteTime: null, relativeValue: 90, relativeUnit: 'Minutes' }],
    });
    expect(reminderConfigToOffsetMinutes(config)).toBe(90);
    expect(reminderConfigToOffsetMinutes({
      enabled: true,
      triggers: [{ type: 'Relative', absoluteTime: null, relativeValue: 2, relativeUnit: 'Hours' }],
    })).toBe(120);
  });
});
