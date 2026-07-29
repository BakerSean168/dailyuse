/**
 * Residual 1015: sole buildRecurrenceRule for API/Desktop goal automation task templates.
 * Maps plan cadence (daily/weekly/once) → recurrence config | null.
 * once → null; weekly uses current weekday; daily uses empty daysOfWeek.
 *
 * Frequency / weekday numeric values match @memoflow/contracts/task
 * RecurrenceFrequency + DayOfWeek (imported as string/number literals to keep
 * utils free of contracts OpenAPI schema side-effects in unit tests).
 */

export type GoalAutomationTaskCadence = 'daily' | 'weekly' | 'once';

/** Mirrors contracts RecurrenceFrequency.Daily / Weekly. */
const FREQUENCY_DAILY = 'Daily' as const;
const FREQUENCY_WEEKLY = 'Weekly' as const;

/** Mirrors contracts DayOfWeek (0=Sunday … 6=Saturday). */
export type BuildRecurrenceDayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type BuildRecurrenceRuleResult = {
  frequency: typeof FREQUENCY_DAILY | typeof FREQUENCY_WEEKLY;
  interval: number;
  daysOfWeek: BuildRecurrenceDayOfWeek[];
  endDate: null;
  occurrences: null;
};

function asDayOfWeek(value: number): BuildRecurrenceDayOfWeek {
  const day = Math.trunc(value) % 7;
  const normalized = day < 0 ? day + 7 : day;
  return normalized as BuildRecurrenceDayOfWeek;
}

export function buildRecurrenceRule(
  cadence: GoalAutomationTaskCadence,
  now = new Date(),
): BuildRecurrenceRuleResult | null {
  if (cadence === 'once') {
    return null;
  }

  if (cadence === 'weekly') {
    return {
      frequency: FREQUENCY_WEEKLY,
      interval: 1,
      daysOfWeek: [asDayOfWeek(now.getDay())],
      endDate: null,
      occurrences: null,
    };
  }

  return {
    frequency: FREQUENCY_DAILY,
    interval: 1,
    daysOfWeek: [],
    endDate: null,
    occurrences: null,
  };
}
