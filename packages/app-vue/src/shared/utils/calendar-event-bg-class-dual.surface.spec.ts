import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { calendarEventBgClass } from '../../modules/schedule/composables/useCalendarView';

/**
 * Residual 1288: eventBgClass dual retired onto schedule calendarEventBgClass sole.
 * - sole: packages/app-vue/src/modules/schedule/composables/useCalendarView.ts#calendarEventBgClass
 * - consumers: DayViewCalendar + WeekViewCalendar
 * Soft residual 1288: Month eventClass translucent/text variants keep-boundary
 * Soft residual 1288: getEventStyle Day px vs Week % layout keep-boundary
 * Soft residual 1291: sourceLabel dual retired onto calendarEventSourceLabel sole
 * Does not flip §13.2 checkboxes.
 */
describe('calendarEventBgClass dual retired (residual 1288)', () => {
  const dir = __dirname;
  const sole = readFileSync(
    resolve(dir, '../../modules/schedule/composables/useCalendarView.ts'),
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
  const month = readFileSync(
    resolve(dir, '../../modules/schedule/components/MonthViewCalendar.vue'),
    'utf8',
  );

  it('owns sole calendarEventBgClass body (Residual 1288)', () => {
    expect(sole).toContain('Residual 1288');
    expect(sole).toMatch(/export function calendarEventBgClass\b/);
    const body = sole.match(/export function calendarEventBgClass\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('hasConflict');
    expect(body).toContain('bg-warning');
    expect(body).toContain('bg-primary');
    expect(body).toContain('bg-success');
    expect(body).toContain('bg-info');
    expect(body).not.toContain('bg-primary/10');
  });

  it('retires Day/Week eventBgClass dual bodies onto schedule sole', () => {
    for (const [label, source] of [
      ['day', day],
      ['week', week],
    ] as const) {
      expect(source, label).toContain('Residual 1288');
      expect(source, label).toContain('calendarEventBgClass');
      expect(source, label).not.toMatch(/function eventBgClass\b/);
      expect(source, label).not.toMatch(/function calendarEventBgClass\b/);
      expect(source, label).not.toMatch(
        /function eventBgClass\b[\s\S]*?bg-primary/,
      );
    }
  });

  it('soft residual 1288 Month eventClass + Day/Week getEventStyle keep-boundaries', () => {
    expect(month).toMatch(/function eventClass\b/);
    expect(month).toContain('bg-primary/10');
    expect(month).toContain('text-primary');
    expect(month).not.toContain('calendarEventBgClass');

    const dayStyle = day.match(/function getEventStyle\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(dayStyle).toContain('px');
    expect(dayStyle).toContain('64');
    expect(dayStyle).not.toContain('%');

    const weekStyle = week.match(/function getEventStyle\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(weekStyle).toContain('%');
    expect(weekStyle).not.toContain('64');
  });

  it('runtime: sole maps conflict and source to solid bg classes', () => {
    expect(calendarEventBgClass({ source: 'schedule', hasConflict: true })).toBe('bg-warning');
    expect(calendarEventBgClass({ source: 'schedule', hasConflict: false })).toBe('bg-primary');
    expect(calendarEventBgClass({ source: 'goal', hasConflict: false })).toBe('bg-success');
    expect(calendarEventBgClass({ source: 'task', hasConflict: false })).toBe('bg-info');
  });

  it('documents residual 1288 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'calendar-event-bg-class-dual.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1288');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('dual retired');
  });
});
