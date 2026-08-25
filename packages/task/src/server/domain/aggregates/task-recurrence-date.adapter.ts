import { RecurrenceFrequency as TaskRecurrenceFrequency } from '@memoflow/contracts/task';
import {
  asHm,
  asInstant,
  asYmd,
  createRecurrenceEngine,
  createTimeFacade,
  resolveTimeZoneId,
  type RecurrenceFrequency,
  type RecurrenceSchedule,
  type RecurrenceWeekday,
} from '@memoflow/time';
import type { RecurrenceRule, TaskTimeConfig } from '../value-objects';

const taskTime = createTimeFacade();
const recurrenceEngine = createRecurrenceEngine();
const UNANCHORED_RECURRENCE_START = asYmd('1970-01-01');

const FREQUENCY_MAP: Record<TaskRecurrenceFrequency, RecurrenceFrequency> = {
  [TaskRecurrenceFrequency.Daily]: 'daily',
  [TaskRecurrenceFrequency.Weekly]: 'weekly',
  [TaskRecurrenceFrequency.Monthly]: 'monthly',
  [TaskRecurrenceFrequency.Yearly]: 'yearly',
};

function toSchedule(
  rule: RecurrenceRule,
  timeConfig: TaskTimeConfig | null,
): RecurrenceSchedule {
  const startDate =
    timeConfig?.startDate != null
      ? taskTime.codec.toYmd(asInstant(timeConfig.startDate))
      : UNANCHORED_RECURRENCE_START;

  return {
    startDate,
    // Task occurrence date math is day-anchored. TaskTimeConfig retains the actual
    // time point/range independently; recurrence must not absorb that business DTO.
    localTime: asHm('00:00'),
    timeZone: resolveTimeZoneId('local'),
    frequency: FREQUENCY_MAP[rule.frequency],
    interval: rule.interval,
    byWeekday: rule.daysOfWeek as RecurrenceWeekday[],
    count: rule.occurrences,
    // Existing Task semantics treat endDate as inclusive for the whole local day.
    until:
      rule.endDate == null
        ? null
        : taskTime.calendar.endOfDay(asInstant(rule.endDate)),
  };
}

export function recurrenceDatesBetween(
  rule: RecurrenceRule,
  timeConfig: TaskTimeConfig | null,
  from: number,
  to: number,
): number[] {
  return recurrenceEngine.between(toSchedule(rule, timeConfig), {
    from: asInstant(from),
    to: asInstant(to),
    inclusive: true,
  });
}

export function recurrenceOccursOn(
  rule: RecurrenceRule,
  timeConfig: TaskTimeConfig | null,
  candidateDay: number,
): boolean {
  const from = taskTime.calendar.startOfDay(asInstant(candidateDay));
  const to = taskTime.calendar.endOfDay(asInstant(candidateDay));
  return recurrenceDatesBetween(rule, timeConfig, from, to).length > 0;
}

export function nextRecurrenceDate(
  rule: RecurrenceRule,
  timeConfig: TaskTimeConfig | null,
  after: number,
): number | null {
  return recurrenceEngine.next(toSchedule(rule, timeConfig), asInstant(after), false);
}
