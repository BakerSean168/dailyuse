import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatLocalHHmm } from './format-local-hhmm';

/**
 * Residual 1300: Day/Week formatEventTime inner HH:mm dual retired onto formatLocalHHmm sole.
 * Residual 1279 separator keep-boundary remains (Day " - " vs Week compact "-").
 * Soft residual: Month eventClass translucent/text vs calendarEventBgClass; getEventStyle Day px vs Week %.
 * Does not flip §13.2 checkboxes.
 */
describe('formatEventTime local HH:mm dual retired (residual 1300)', () => {
  const dir = __dirname;
  const day = readFileSync(
    resolve(dir, '../../modules/schedule/components/DayViewCalendar.vue'),
    'utf8',
  );
  const week = readFileSync(
    resolve(dir, '../../modules/schedule/components/WeekViewCalendar.vue'),
    'utf8',
  );
  const sole = readFileSync(resolve(dir, 'format-local-hhmm.ts'), 'utf8');

  it('owns Residual 1300 markers and formatLocalHHmm consumption on Day/Week', () => {
    expect(day).toContain('Residual 1300');
    expect(week).toContain('Residual 1300');
    expect(day).toContain('formatLocalHHmm');
    expect(week).toContain('formatLocalHHmm');
    expect(sole).toMatch(/export function formatLocalHHmm\b/);
  });

  it('retires Day/Week padStart dual bodies while keeping separator keep-boundary', () => {
    const dayBody = day.match(/function formatEventTime\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(dayBody).toContain('formatLocalHHmm');
    expect(dayBody).toContain(' - ');
    expect(dayBody).not.toContain('padStart');
    expect(dayBody).not.toContain('getHours');

    const weekBody = week.match(/function formatEventTime\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(weekBody).toContain('formatLocalHHmm');
    expect(weekBody).toContain('}-${');
    expect(weekBody).not.toContain('padStart');
    expect(weekBody).not.toContain('getHours');
    expect(weekBody).not.toContain(' - ');
  });

  it('soft residual: Month eventClass + getEventStyle Day/Week keep-boundaries stay separate', () => {
    const month = readFileSync(
      resolve(dir, '../../modules/schedule/components/MonthViewCalendar.vue'),
      'utf8',
    );
    const dayView = readFileSync(
      resolve(dir, '../../modules/schedule/components/DayViewCalendar.vue'),
      'utf8',
    );
    const weekView = readFileSync(
      resolve(dir, '../../modules/schedule/components/WeekViewCalendar.vue'),
      'utf8',
    );
    expect(month).toMatch(/function eventClass\b/);
    expect(month).toContain('bg-warning/15');
    expect(month).toContain(':class="eventClass(event)"');
    expect(month).not.toContain(':class="calendarEventBgClass(event)"');
    const dayStyle = dayView.match(/function getEventStyle\([\s\S]*?\n\}/)?.[0] ?? '';
    const weekStyle = weekView.match(/function getEventStyle\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(dayStyle).toContain('px');
    expect(weekStyle).toContain('%');
  });

  it('runtime: formatLocalHHmm agrees with Day/Week clock fragment', () => {
    const start = new Date(2026, 6, 24, 9, 5, 0).getTime();
    const end = new Date(2026, 6, 24, 10, 30, 0).getTime();
    expect(formatLocalHHmm(start)).toBe('09:05');
    expect(formatLocalHHmm(end)).toBe('10:30');
    expect(`${formatLocalHHmm(start)} - ${formatLocalHHmm(end)}`).toBe('09:05 - 10:30');
    expect(`${formatLocalHHmm(start)}-${formatLocalHHmm(end)}`).toBe('09:05-10:30');
  });

  it('documents residual 1300 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'format-event-time-local-hhmm-dual.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1300');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('dual retired');
  });
});
