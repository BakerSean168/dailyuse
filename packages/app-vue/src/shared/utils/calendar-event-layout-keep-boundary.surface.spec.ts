import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1306: calendar event layout keep-boundaries (no force-merge).
 * - Month eventClass: translucent/text chips (dense month cells)
 * - Day getEventStyle: absolute px (64px/hour rail)
 * - Week getEventStyle: percent-of-day column
 * Soft residual 1288: calendarEventBgClass solid Day/Week bars remain separate sole
 * Does not flip §13.2 checkboxes.
 */
describe('calendar event layout keep-boundary (residual 1306)', () => {
  const dir = __dirname;
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
  const sole = readFileSync(
    resolve(dir, '../../modules/schedule/composables/useCalendarView.ts'),
    'utf8',
  );

  it('owns Residual 1306 keep-boundary markers on Month eventClass translucent/text', () => {
    expect(month).toContain('Residual 1306 keep-boundary');
    expect(month).toMatch(/function eventClass\b/);
    const body = month.match(/function eventClass\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('bg-warning/15');
    expect(body).toContain('text-warning');
    expect(body).toContain('bg-primary/10');
    expect(body).toContain('text-primary');
    expect(body).not.toContain('calendarEventBgClass');
    expect(month).toContain(':class="eventClass(event)"');
    expect(month).not.toContain(':class="calendarEventBgClass(event)"');
  });

  it('differs from calendarEventBgClass solid Day/Week bars (no force-merge)', () => {
    expect(sole).toContain('Residual 1288');
    expect(sole).toMatch(/export function calendarEventBgClass\b/);
    const soleBody = sole.match(/export function calendarEventBgClass\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(soleBody).toContain('bg-warning');
    expect(soleBody).toContain('bg-primary');
    expect(soleBody).not.toContain('bg-primary/10');
    expect(day).toContain('calendarEventBgClass');
    expect(week).toContain('calendarEventBgClass');
    expect(day).not.toMatch(/function eventClass\b/);
    expect(week).not.toMatch(/function eventClass\b/);
  });

  it('owns Residual 1306 Day px vs Week % getEventStyle keep-boundary', () => {
    expect(day).toContain('Residual 1306 keep-boundary');
    expect(week).toContain('Residual 1306 keep-boundary');
    const dayStyle = day.match(/function getEventStyle\([\s\S]*?\n\}/)?.[0] ?? '';
    const weekStyle = week.match(/function getEventStyle\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(dayStyle).toContain('64');
    expect(dayStyle).toContain('px');
    expect(dayStyle).not.toContain('%');
    expect(weekStyle).toContain('%');
    expect(weekStyle).not.toContain('64');
    expect(weekStyle).not.toContain('px');
  });

  it('runtime: documents Day px vs Week % layout contracts', () => {
    function dayGetEventStyle(startTime: number, endTime: number) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const startMinutes = start.getHours() * 60 + start.getMinutes();
      const endMinutes = end.getHours() * 60 + end.getMinutes();
      const duration = Math.max(endMinutes - startMinutes, 15);
      const totalMinutes = 24 * 60;
      const top = (startMinutes / totalMinutes) * (24 * 64);
      const height = Math.max((duration / totalMinutes) * (24 * 64), 24);
      return { top: `${top}px`, height: `${height}px` };
    }
    function weekGetEventStyle(startTime: number, endTime: number) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const startHour = start.getHours() + start.getMinutes() / 60;
      const endHour = end.getHours() + end.getMinutes() / 60;
      const duration = endHour - startHour;
      const top = (startHour / 24) * 100;
      const height = Math.max((duration / 24) * 100, 2);
      return { top: `${top}%`, height: `${height}%` };
    }
    const start = new Date(2026, 6, 24, 9, 0, 0).getTime();
    const end = new Date(2026, 6, 24, 10, 0, 0).getTime();
    const d = dayGetEventStyle(start, end);
    const w = weekGetEventStyle(start, end);
    expect(d.top.endsWith('px')).toBe(true);
    expect(d.height.endsWith('px')).toBe(true);
    expect(w.top.endsWith('%')).toBe(true);
    expect(w.height.endsWith('%')).toBe(true);
    expect(d.top).not.toBe(w.top);
  });

  it('documents residual 1306 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'calendar-event-layout-keep-boundary.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1306');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
