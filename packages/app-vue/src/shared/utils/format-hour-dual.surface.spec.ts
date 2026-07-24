import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatHour } from './format-hour';

/**
 * Residual 1276: formatHour dual retired onto app-vue shared sole.
 * - sole: packages/app-vue/src/shared/utils/format-hour.ts
 * - consumers: DayViewCalendar + WeekViewCalendar
 * Soft residual 1276: formatEventTime Day (" - ") vs Week ("-") separators stay co-located
 * Soft residual 1273: formatCalendarEventTimeRange dual-retired sole remains separate
 * Does not flip §13.2 checkboxes.
 */
describe('formatHour dual retired (residual 1276)', () => {
  const dir = __dirname;
  const sole = readFileSync(resolve(dir, 'format-hour.ts'), 'utf8');
  const day = readFileSync(
    resolve(dir, '../../modules/schedule/components/DayViewCalendar.vue'),
    'utf8',
  );
  const week = readFileSync(
    resolve(dir, '../../modules/schedule/components/WeekViewCalendar.vue'),
    'utf8',
  );
  const eventRangeSole = readFileSync(
    resolve(dir, 'format-calendar-event-time-range.ts'),
    'utf8',
  );

  it('owns sole formatHour body (Residual 1276)', () => {
    expect(sole).toContain('Residual 1276');
    expect(sole).toMatch(/export function formatHour\b/);
    expect(sole).toContain("padStart(2, '0')");
    expect(sole).toContain(':00');
    const body = sole.match(/export function formatHour\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('hour: number');
    expect(body).not.toContain('CalendarEventItem');
    expect(body).not.toContain('all-day');
  });

  it('retires Day/Week dual bodies onto shared sole', () => {
    for (const [label, source] of [
      ['day', day],
      ['week', week],
    ] as const) {
      expect(source, label).toContain('Residual 1276');
      expect(source, label).toContain('format-hour');
      expect(source, label).toContain('formatHour');
      expect(source, label).not.toMatch(/function formatHour\b/);
      expect(source, label).not.toMatch(
        /function formatHour\b[\s\S]*?padStart/,
      );
    }
  });

  it('soft residual 1276 formatEventTime separators + event-range sole stay separate', () => {
    expect(day).toContain('Soft residual 1276');
    const dayEvent = day.match(/function formatEventTime\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(dayEvent).toContain(' - ');
    expect(dayEvent).not.toContain('–');
    expect(dayEvent).not.toContain('formatCalendarEventTimeRange');

    expect(week).toContain('Soft residual 1276');
    const weekEvent = week.match(/function formatEventTime\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(weekEvent).toContain('}-${');
    expect(weekEvent).not.toContain(' - ');
    expect(weekEvent).not.toContain('–');

    expect(eventRangeSole).toContain('Residual 1273');
    expect(eventRangeSole).toContain('–');
  });

  it('runtime: sole pads hour to HH:00', () => {
    expect(formatHour(0)).toBe('00:00');
    expect(formatHour(9)).toBe('09:00');
    expect(formatHour(23)).toBe('23:00');
  });

  it('documents residual 1276 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'format-hour-dual.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1276');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('dual retired');
  });
});
