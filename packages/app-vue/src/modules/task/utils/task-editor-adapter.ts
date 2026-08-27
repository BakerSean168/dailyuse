import {
  ReminderTimeUnit,
  TaskReminderType,
  TaskTimeType,
  type DayOfWeek,
  type RecurrenceRuleDTO,
  type TaskReminderConfigDTO,
  type TaskTimeConfigDTO,
  type TaskTimeConfigReq,
} from '@memoflow/contracts/task';
import {
  asHm,
  asInstant,
  type Hm,
  type Ymd,
} from '@memoflow/time';
import type { RecurrenceEditorValue } from '@memoflow/ui-vue-shadcn';
import { formatHHmmParts } from '../../../shared/utils/format-hhmm-parts';
import { getProductTime } from '../../../shared/utils/product-time';

export interface TaskEditorTimeValue {
  date: Ymd | null;
  startTime: Hm | null;
  endTime: Hm | null;
}

export type TaskEditorTimeError = 'date-required' | 'end-without-start' | 'end-before-start';

export interface TaskEditorTimeResolution {
  value: TaskTimeConfigReq | null;
  error: TaskEditorTimeError | null;
}

function minuteOfDayToHm(value: number | null | undefined): Hm | null {
  if (value == null || !Number.isInteger(value) || value < 0 || value > 1439) return null;
  return asHm(formatHHmmParts(Math.floor(value / 60), value % 60));
}

function hmToMinuteOfDay(value: Hm): number {
  const [hour, minute] = String(value).split(':').map(Number);
  return hour * 60 + minute;
}

function instantToYmd(value: number | null | undefined): Ymd | null {
  if (value == null || !Number.isFinite(value)) return null;
  return getProductTime().codec.toYmd(asInstant(value));
}

function ymdToInstant(value: Ymd): number {
  return getProductTime().codec.startOfYmd(value);
}

export function taskTimeConfigToEditor(
  timeConfig: TaskTimeConfigDTO | null | undefined,
): TaskEditorTimeValue {
  if (!timeConfig) return { date: null, startTime: null, endTime: null };

  const date = instantToYmd(timeConfig.startDate);
  if (timeConfig.timeType === TaskTimeType.TimePoint) {
    return {
      date,
      startTime: minuteOfDayToHm(timeConfig.timePoint),
      endTime: null,
    };
  }
  if (timeConfig.timeType === TaskTimeType.TimeRange && timeConfig.timeRange) {
    return {
      date,
      startTime: minuteOfDayToHm(timeConfig.timeRange.start),
      endTime: minuteOfDayToHm(timeConfig.timeRange.end),
    };
  }
  return { date, startTime: null, endTime: null };
}

export function resolveTaskEditorTime(value: TaskEditorTimeValue): TaskEditorTimeResolution {
  if (!value.date) return { value: null, error: 'date-required' };
  if (!value.startTime && value.endTime) return { value: null, error: 'end-without-start' };

  const startDate = ymdToInstant(value.date);
  if (!value.startTime) {
    return {
      value: {
        timeType: TaskTimeType.AllDay,
        startDate,
        timePoint: null,
        timeRange: null,
      },
      error: null,
    };
  }

  const start = hmToMinuteOfDay(value.startTime);
  if (!value.endTime) {
    return {
      value: {
        timeType: TaskTimeType.TimePoint,
        startDate,
        timePoint: start,
        timeRange: null,
      },
      error: null,
    };
  }

  const end = hmToMinuteOfDay(value.endTime);
  if (end <= start) return { value: null, error: 'end-before-start' };
  return {
    value: {
      timeType: TaskTimeType.TimeRange,
      startDate,
      timePoint: null,
      timeRange: { start, end },
    },
    error: null,
  };
}

export function recurrenceRuleToEditor(
  rule: RecurrenceRuleDTO | null | undefined,
): RecurrenceEditorValue | null {
  if (!rule) return null;
  return {
    frequency: rule.frequency,
    interval: rule.interval,
    daysOfWeek: [...rule.daysOfWeek],
    endMode: rule.endDate != null ? 'date' : rule.occurrences != null ? 'count' : 'never',
    endDate: instantToYmd(rule.endDate),
    occurrences: rule.occurrences,
  };
}

export function recurrenceEditorToRule(
  value: RecurrenceEditorValue | null,
): RecurrenceRuleDTO | null {
  if (!value) return null;
  return {
    frequency: value.frequency,
    interval: Math.max(1, Math.round(value.interval)),
    daysOfWeek:
      value.frequency === 'Weekly'
        ? value.daysOfWeek.filter((day): day is DayOfWeek =>
            Number.isInteger(day) && day >= 0 && day <= 6,
          )
        : [],
    endDate: value.endMode === 'date' && value.endDate ? ymdToInstant(value.endDate) : null,
    occurrences:
      value.endMode === 'count' && value.occurrences != null
        ? Math.max(1, Math.round(value.occurrences))
        : null,
  };
}

export function reminderConfigToOffsetMinutes(
  config: TaskReminderConfigDTO | null | undefined,
): number | null {
  if (!config?.enabled || config.triggers.length !== 1) return null;
  const trigger = config.triggers[0];
  if (
    trigger.type !== TaskReminderType.Relative ||
    trigger.relativeValue == null ||
    trigger.relativeUnit == null
  ) {
    return null;
  }
  const multiplier =
    trigger.relativeUnit === ReminderTimeUnit.Days
      ? 24 * 60
      : trigger.relativeUnit === ReminderTimeUnit.Hours
        ? 60
        : 1;
  return trigger.relativeValue * multiplier;
}

export function reminderOffsetMinutesToConfig(
  value: number | null,
): TaskReminderConfigDTO | null {
  if (value == null) return null;
  return {
    enabled: true,
    triggers: [
      {
        type: TaskReminderType.Relative,
        absoluteTime: null,
        relativeValue: Math.max(0, Math.round(value)),
        relativeUnit: ReminderTimeUnit.Minutes,
      },
    ],
  };
}
