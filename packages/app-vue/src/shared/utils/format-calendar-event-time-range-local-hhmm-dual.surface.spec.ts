import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatCalendarEventTimeRange } from './format-calendar-event-time-range';
import { formatLocalHHmm } from './format-local-hhmm';

/**
 * Residual 1303: formatCalendarEventTimeRange inner HH:mm dual retired onto formatLocalHHmm sole.
 * Residual 1273 en-dash range sole + DayDetail/Panel consumers remain; only padStart body retires.
 * Soft residual: Month eventClass translucent/text vs calendarEventBgClass solid; getEventStyle Day px vs Week %.
 * Does not flip §13.2 checkboxes.
 */
describe('formatCalendarEventTimeRange → formatLocalHHmm dual retired (residual 1303)', () => {
  const dir = __dirname;
  const sole = readFileSync(resolve(dir, 'format-calendar-event-time-range.ts'), 'utf8');
  const local = readFileSync(resolve(dir, 'format-local-hhmm.ts'), 'utf8');

  it('owns Residual 1303 composition of formatCalendarEventTimeRange onto formatLocalHHmm', () => {
    expect(sole).toContain('Residual 1303');
    expect(sole).toContain('formatLocalHHmm');
    expect(sole).toContain('–');
    expect(sole).toMatch(/export function formatCalendarEventTimeRange\b/);
    const body = sole.match(/export function formatCalendarEventTimeRange\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('formatLocalHHmm');
    expect(body).not.toContain('padStart');
    expect(body).not.toContain('getHours');
    expect(local).toMatch(/export function formatLocalHHmm\b/);
  });

  it('keeps Residual 1273 en-dash sole contract + DayDetail/Panel consumers', () => {
    expect(sole).toContain('Residual 1273');
    const day = readFileSync(
      resolve(dir, '../../modules/schedule/components/DayDetailSheet.vue'),
      'utf8',
    );
    const panel = readFileSync(
      resolve(dir, '../../modules/schedule/components/TaskEventActionPanel.vue'),
      'utf8',
    );
    expect(day).toContain('formatCalendarEventTimeRange');
    expect(panel).toContain('formatCalendarEventTimeRange');
  });

  it('soft residual: Month eventClass + Day/Week getEventStyle keep-boundaries stay separate', () => {
    const month = readFileSync(
      resolve(dir, '../../modules/schedule/components/MonthViewCalendar.vue'),
      'utf8',
    );
    const day = readFileSync(
      resolve(dir, '../../modules/schedule/components/DayViewCalendar.vue'),
      'utf8',
    );
    const week = readFileSync(
      resolve(dir, '../../modules/schedule/components/WeekViewCalendar.vue'),
      'utf8',
    );
    expect(month).toMatch(/function eventClass\b/);
    expect(month).toContain('bg-warning/15');
    expect(month).toContain(':class="eventClass(event)"');
    expect(month).not.toContain(':class="calendarEventBgClass(event)"');
    const dayStyle = day.match(/function getEventStyle\([\s\S]*?\n\}/)?.[0] ?? '';
    const weekStyle = week.match(/function getEventStyle\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(dayStyle).toContain('64');
    expect(dayStyle).toContain('px');
    expect(weekStyle).toContain('%');
    expect(weekStyle).not.toContain('64');
  });

  it('runtime: range sole agrees with formatLocalHHmm + en-dash', () => {
    const start = new Date(2026, 6, 24, 9, 5, 0).getTime();
    const end = new Date(2026, 6, 24, 10, 30, 0).getTime();
    expect(formatLocalHHmm(start)).toBe('09:05');
    expect(formatLocalHHmm(end)).toBe('10:30');
    expect(formatCalendarEventTimeRange({ startTime: start, endTime: end }, '整天')).toBe(
      '09:05 – 10:30',
    );
    expect(
      formatCalendarEventTimeRange(
        { displayMode: 'all-day', startTime: start, endTime: end },
        '整天',
      ),
    ).toBe('整天');
  });

  it('documents residual 1303 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'format-calendar-event-time-range-local-hhmm-dual.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1303');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('dual retired');
  });
});
