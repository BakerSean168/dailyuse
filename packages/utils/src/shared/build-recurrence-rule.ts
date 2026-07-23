/**
 * Residual 1015: sole buildRecurrenceRule for API/Desktop goal automation task templates.
 * Maps plan cadence (daily/weekly/once) → recurrence config | null.
 * once → null; weekly uses current weekday; daily uses empty daysOfWeek.
 *
 * Frequency / weekday numeric values match @dailyuse/contracts/task
 * RecurrenceFrequency + DayOfWeek (imported as string/number literals to keep
 * utils free of contracts OpenAPI schema side-effects in unit tests).
 */

export type GoalAutomationTaskCadence = 'daily' | 'weekly' | 'once';

/** Mirrors contracts RecurrenceFrequency.Daily / Weekly. */
const FREQUENCY_DAILY = 'Daily' as const;
const FREQUENCY_WEEKLY = 'Weekly' as const;

export type BuildRecurrenceRuleResult = {
  frequency: typeof FREQUENCY_DAILY | typeof FREQUENCY_WEEKLY;
  interval: number;
  daysOfWeek: number[];
  endDate: null;
  occurrences: null;
};

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
      daysOfWeek: [now.getDay()],
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
