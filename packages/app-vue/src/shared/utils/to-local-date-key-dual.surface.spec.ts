import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { toLocalDateKey } from '../../modules/schedule/composables/useCalendarView';
import { formatDateToYMD } from './format-date-to-ymd';

/**
 * Residual 1282: toDateStr dual retired onto schedule toLocalDateKey sole.
 * - sole: packages/app-vue/src/modules/schedule/composables/useCalendarView.ts#toLocalDateKey
 * - consumers: DayViewCalendar + WeekViewCalendar + MonthViewCalendar
 * Soft residual 1252: formatDateToYMD dual-retired Date-only form sole remains separate
 * Soft residual 1282: getWeekStart dual (WeekView + ScheduleCalendarView) remains co-located
 * Does not flip §13.2 checkboxes.
 */
describe('toLocalDateKey dual retired (residual 1282)', () => {
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
  const formatYmd = readFileSync(resolve(dir, 'format-date-to-ymd.ts'), 'utf8');

  it('owns sole toLocalDateKey body (Residual 1282)', () => {
    expect(sole).toContain('Residual 1282');
    expect(sole).toMatch(/export function toLocalDateKey\b/);
    expect(sole).toContain("padStart(2, '0')");
    const body = sole.match(/export function toLocalDateKey\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('Date | number');
    expect(body).toContain('getFullYear');
    expect(body).toContain('getMonth()');
    expect(body).toContain('getDate()');
    expect(body).toContain('typeof value === \'number\'');
  });

  it('retires Day/Week/Month toDateStr dual bodies onto toLocalDateKey sole', () => {
    for (const [label, source] of [
      ['day', day],
      ['week', week],
      ['month', month],
    ] as const) {
      expect(source, label).toContain('Residual 1282');
      expect(source, label).toContain('toLocalDateKey');
      expect(source, label).not.toMatch(/function toDateStr\b/);
      expect(source, label).not.toMatch(/function toLocalDateKey\b/);
      expect(source, label).not.toMatch(
        /function toDateStr\b[\s\S]*?getFullYear/,
      );
    }
  });

  it('soft residual 1252 formatDateToYMD Date-only sole + getWeekStart dual stay separate', () => {
    expect(formatYmd).toContain('Residual 1252');
    expect(formatYmd).toMatch(/export function formatDateToYMD\b/);
    const ymdBody = formatYmd.match(/export function formatDateToYMD\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(ymdBody).toContain('date: Date');
    expect(ymdBody).not.toContain('number');

    // Date branch parity without force-merging form sole into calendar key sole
    expect(formatDateToYMD(new Date(2026, 6, 24))).toBe(toLocalDateKey(new Date(2026, 6, 24)));

    expect(week).toMatch(/function getWeekStart\b/);
    const scheduleView = readFileSync(
      resolve(dir, '../../modules/schedule/views/ScheduleCalendarView.vue'),
      'utf8',
    );
    expect(scheduleView).toMatch(/function getWeekStart\b/);
  });

  it('runtime: sole formats Date and ms timestamp to YYYY-MM-DD', () => {
    expect(toLocalDateKey(new Date(2026, 6, 24))).toBe('2026-07-24');
    expect(toLocalDateKey(new Date(2026, 0, 5).getTime())).toBe('2026-01-05');
  });

  it('documents residual 1282 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'to-local-date-key-dual.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1282');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('dual retired');
  });
});
