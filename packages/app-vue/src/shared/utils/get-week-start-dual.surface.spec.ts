import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getWeekStart, toLocalDateKey } from '../../modules/schedule/composables/useCalendarView';

/**
 * Residual 1285: getWeekStart dual retired onto schedule getWeekStart sole.
 * - sole: packages/app-vue/src/modules/schedule/composables/useCalendarView.ts#getWeekStart
 * - consumers: WeekViewCalendar + ScheduleCalendarView
 * Soft residual 1282: toLocalDateKey dual-retired sole remains separate
 * Soft residual 1285: formatCapsuleTime / multi-site HH:mm padStart keep-boundaries remain separate
 * Soft residual 1288: eventBgClass dual retired onto calendarEventBgClass sole
 * Does not flip §13.2 checkboxes.
 */
describe('getWeekStart dual retired (residual 1285)', () => {
  const dir = __dirname;
  const sole = readFileSync(
    resolve(dir, '../../modules/schedule/composables/useCalendarView.ts'),
    'utf8',
  );
  const week = readFileSync(
    resolve(dir, '../../modules/schedule/components/WeekViewCalendar.vue'),
    'utf8',
  );
  const view = readFileSync(
    resolve(dir, '../../modules/schedule/views/ScheduleCalendarView.vue'),
    'utf8',
  );

  it('owns sole getWeekStart body (Residual 1285)', () => {
    expect(sole).toContain('Residual 1285');
    expect(sole).toMatch(/export function getWeekStart\b/);
    const body = sole.match(/export function getWeekStart\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('date: Date');
    expect(body).toContain('getDay()');
    expect(body).toContain('day === 0 ? -6 : 1 - day');
    expect(body).toContain('setHours(0, 0, 0, 0)');
    expect(body).toContain('Monday as week start');
  });

  it('retires WeekView + ScheduleCalendarView dual bodies onto schedule sole', () => {
    for (const [label, source] of [
      ['week', week],
      ['view', view],
    ] as const) {
      expect(source, label).toContain('Residual 1285');
      expect(source, label).toContain('getWeekStart');
      expect(source, label).toContain('useCalendarView');
      expect(source, label).not.toMatch(/function getWeekStart\b/);
      expect(source, label).not.toMatch(
        /function getWeekStart\b[\s\S]*?setHours\(0, 0, 0, 0\)/,
      );
    }
  });

  it('soft residual 1282 toLocalDateKey sole stays separate', () => {
    expect(sole).toContain('Residual 1282');
    expect(sole).toMatch(/export function toLocalDateKey\b/);
    expect(toLocalDateKey(new Date(2026, 6, 24))).toBe('2026-07-24');
  });

  it('runtime: sole Monday-starts local week and zeros hours', () => {
    // 2026-07-24 is Friday → week starts Monday 2026-07-20
    const fri = new Date(2026, 6, 24, 15, 30, 0);
    const start = getWeekStart(fri);
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(6);
    expect(start.getDate()).toBe(20);
    expect(start.getDay()).toBe(1);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);

    // Sunday maps back to prior Monday
    const sun = new Date(2026, 6, 26, 8, 0, 0); // Sunday
    const sunStart = getWeekStart(sun);
    expect(sunStart.getDate()).toBe(20);
    expect(sunStart.getDay()).toBe(1);
  });

  it('documents residual 1285 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'get-week-start-dual.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1285');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('dual retired');
  });
});
