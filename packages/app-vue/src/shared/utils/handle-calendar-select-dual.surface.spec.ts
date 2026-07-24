import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { handleCalendarSelect } from './handle-calendar-select';

/**
 * Residual 1258: handleCalendarSelect dual retired onto app-vue shared sole.
 * - sole: packages/app-vue/src/shared/utils/handle-calendar-select.ts
 * - consumers: CreateScheduleDialog, TimeConfigSection, RecurrenceSection (Residual 1267)
 * Soft residual 1258 / 1267:
 * - ReminderSection inline calendar → dateStr+timestamp path
 * Soft residual 1267: Recurrence handleEndDateCalendarSelect dual-retired onto sole.
 * Soft residual 1252: formatDateToYMD dual-retired sole remains separate.
 * Soft residual 1255: parseToDate dual-retired sole remains separate.
 * Does not flip §13.2 checkboxes.
 */
describe('handleCalendarSelect dual retired (residual 1258)', () => {
  const dir = __dirname;
  const sole = readFileSync(resolve(dir, 'handle-calendar-select.ts'), 'utf8');
  const schedule = readFileSync(
    resolve(dir, '../../modules/schedule/components/CreateScheduleDialog.vue'),
    'utf8',
  );
  const timeConfig = readFileSync(
    resolve(dir, '../../modules/task/components/TaskTemplateForm/sections/TimeConfigSection.vue'),
    'utf8',
  );
  const recurrence = readFileSync(
    resolve(dir, '../../modules/task/components/TaskTemplateForm/sections/RecurrenceSection.vue'),
    'utf8',
  );
  const reminder = readFileSync(
    resolve(dir, '../../modules/task/components/TaskTemplateForm/sections/ReminderSection.vue'),
    'utf8',
  );

  it('owns sole handleCalendarSelect body (Residual 1258)', () => {
    expect(sole).toContain('Residual 1258');
    expect(sole).toMatch(/export function handleCalendarSelect\b/);
    expect(sole).toContain("from './format-date-to-ymd'");
    expect(sole).toContain('formatDateToYMD');
    const body = sole.match(/export function handleCalendarSelect\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('date instanceof Date');
    expect(body).toContain("'toDate' in date");
    expect(body).toContain("setter('')");
  });

  it('retires schedule/task dual bodies onto shared sole', () => {
    expect(schedule).toContain('Residual 1258');
    expect(schedule).toContain('handle-calendar-select');
    expect(schedule).toContain('handleCalendarSelect');
    expect(schedule).not.toMatch(/function handleCalendarSelect\b/);

    expect(timeConfig).toContain('Residual 1258');
    expect(timeConfig).toContain('handle-calendar-select');
    expect(timeConfig).toContain('handleCalendarSelect');
    expect(timeConfig).not.toMatch(/function handleCalendarSelect\b/);

    // Residual 1267 dual-retired Recurrence endDate calendar onto sole.
    expect(recurrence).toContain('Residual 1267');
    expect(recurrence).toContain('handle-calendar-select');
    expect(recurrence).toContain('handleCalendarSelect');
    expect(recurrence).toMatch(/function handleEndDateCalendarSelect\b/);
    const endBody = recurrence.match(/function handleEndDateCalendarSelect\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(endBody).toContain('handleCalendarSelect');
    expect(endBody).toContain('endDate.value');
    expect(endBody).not.toContain('formatDateToYMD');
  });

  it('soft residual 1258/1267 reminder calendar path stays separate', () => {
    expect(reminder).toContain('Soft residual 1258');
    expect(reminder).toContain('formatDateToYMD(date)');
    expect(reminder).not.toContain('handle-calendar-select');
    expect(reminder).not.toMatch(/function handleCalendarSelect\b/);
  });

  it('runtime: sole Date / toDate / empty contracts', () => {
    const seen: string[] = [];
    const set = (v: string) => {
      seen.push(v);
    };
    handleCalendarSelect(new Date(2026, 6, 24), set);
    expect(seen.at(-1)).toBe('2026-07-24');
    handleCalendarSelect({ toDate: () => new Date(2026, 0, 5) }, set);
    expect(seen.at(-1)).toBe('2026-01-05');
    handleCalendarSelect(null, set);
    expect(seen.at(-1)).toBe('');
    handleCalendarSelect('not-a-date', set);
    expect(seen.at(-1)).toBe('');
  });

  it('documents residual 1258 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'handle-calendar-select-dual.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1258');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('dual retired');
  });
});
