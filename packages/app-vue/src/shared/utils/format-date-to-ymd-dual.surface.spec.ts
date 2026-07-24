import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatDateToYMD } from './format-date-to-ymd';

/**
 * Residual 1252: formatDateToYMD dual retired onto app-vue shared sole.
 * Residual 1318: sole body padStart dual retired onto padTwoDigits composition.
 * - sole: packages/app-vue/src/shared/utils/format-date-to-ymd.ts
 * - consumers: CreateScheduleDialog, TimeConfigSection, ReminderSection; Recurrence via handleCalendarSelect (Residual 1267)
 * Soft residual 1252/1255: parseToDate dual retired onto shared sole in residual 1255.
 * Soft residual 1249: formatDisplayDate dual-retired sole remains separate.
 * Soft residual 1240: formatDate keep-boundary remains separate (timestamp display).
 * Soft residual 1282: calendar toDateStr dual retired onto toLocalDateKey (Date|number); Date-only form sole stays separate.
 * Does not flip §13.2 checkboxes.
 */
describe('formatDateToYMD dual retired (residual 1252)', () => {
  const dir = __dirname;
  const sole = readFileSync(resolve(dir, 'format-date-to-ymd.ts'), 'utf8');
  const schedule = readFileSync(
    resolve(dir, '../../modules/schedule/components/CreateScheduleDialog.vue'),
    'utf8',
  );
  const timeConfig = readFileSync(
    resolve(dir, '../../modules/task/components/TaskTemplateForm/sections/TimeConfigSection.vue'),
    'utf8',
  );
  const reminder = readFileSync(
    resolve(dir, '../../modules/task/components/TaskTemplateForm/sections/ReminderSection.vue'),
    'utf8',
  );
  const recurrence = readFileSync(
    resolve(dir, '../../modules/task/components/TaskTemplateForm/sections/RecurrenceSection.vue'),
    'utf8',
  );

  it('owns sole formatDateToYMD body (Residual 1252)', () => {
    expect(sole).toContain('Residual 1252');
    expect(sole).toMatch(/export function formatDateToYMD\b/);
    expect(sole).toContain('getFullYear');
    const body = sole.match(/export function formatDateToYMD\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('date: Date');
    expect(body).toContain('getMonth()');
    expect(body).toContain('getDate()');
    expect(body).toContain('padTwoDigits');
    expect(body).not.toContain('padStart');
    expect(body).toContain('`${y}-${m}-${d}`');
  });

  it('retires schedule/task dual bodies onto shared sole', () => {
    for (const [label, source] of [
      ['schedule', schedule],
      ['timeConfig', timeConfig],
      ['reminder', reminder],
    ] as const) {
      expect(source, label).toContain('Residual 1252');
      expect(source, label).toContain('format-date-to-ymd');
      expect(source, label).toContain('formatDateToYMD');
      expect(source, label).not.toMatch(/function formatDateToYMD\b/);
      expect(source, label).not.toMatch(
        /function formatDateToYMD\b[\s\S]*?getFullYear/,
      );
    }
    // Residual 1267: Recurrence endDate calendar uses handleCalendarSelect (formatDateToYMD via sole).
    expect(recurrence).toContain('Residual 1252');
    expect(recurrence).toContain('formatDateToYMD dual retired');
    expect(recurrence).toContain('Residual 1267');
    expect(recurrence).toContain('handle-calendar-select');
    expect(recurrence).not.toMatch(/function formatDateToYMD\b/);
    expect(recurrence).not.toContain("from '../../../../../shared/utils/format-date-to-ymd'");
  });

  it('soft residual 1252 superseded: parseToDate dual retired in residual 1255', () => {
    // Residual 1255 dual-retired parseToDate/parseInputToDate onto shared sole.
    expect(schedule).toContain('Residual 1255');
    expect(schedule).toContain('parse-to-date');
    expect(schedule).not.toMatch(/function parseToDate\b/);
    expect(timeConfig).toContain('Residual 1255');
    expect(timeConfig).not.toMatch(/function parseInputToDate\b/);
  });

  it('runtime: sole formats local Date to YYYY-MM-DD', () => {
    expect(formatDateToYMD(new Date(2026, 6, 24))).toBe('2026-07-24');
    expect(formatDateToYMD(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(formatDateToYMD(new Date(2026, 11, 9))).toBe('2026-12-09');
  });

  it('documents residual 1252 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'format-date-to-ymd-dual.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1252');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('dual retired');
  });
});
