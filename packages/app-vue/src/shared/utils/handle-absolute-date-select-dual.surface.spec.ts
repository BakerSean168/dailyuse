import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { handleCalendarSelect } from './handle-calendar-select';

/**
 * Residual 1270: handleAbsoluteDateSelect Date/toDate dual retired onto handleCalendarSelect sole.
 * - sole: packages/app-vue/src/shared/utils/handle-calendar-select.ts (Residual 1258)
 * - consumer: ReminderSection handleAbsoluteDateSelect → dateStr then absoluteTime composition
 * Soft residual 1270:
 * - absoluteTime hour/minute composition remains co-located (no force-merge into sole)
 * Soft residual 1267: Recurrence endDate dual-retired onto sole remains separate surface
 * Soft residual 1252: formatDateToYMD dual-retired sole remains separate (getAbsoluteDatePart)
 * Does not flip §13.2 checkboxes.
 */
describe('handleAbsoluteDateSelect dual retired (residual 1270)', () => {
  const dir = __dirname;
  const sole = readFileSync(resolve(dir, 'handle-calendar-select.ts'), 'utf8');
  const reminder = readFileSync(
    resolve(dir, '../../modules/task/components/TaskTemplateForm/sections/ReminderSection.vue'),
    'utf8',
  );
  const recurrence = readFileSync(
    resolve(dir, '../../modules/task/components/TaskTemplateForm/sections/RecurrenceSection.vue'),
    'utf8',
  );

  it('owns Residual 1270 lock on handleCalendarSelect sole consumer notes', () => {
    expect(sole).toContain('Residual 1258');
    expect(sole).toContain('ReminderSection');
    expect(sole).toContain('1270');
    expect(sole).toMatch(/export function handleCalendarSelect\b/);
  });

  it('retires Reminder Date/toDate dual body onto sole', () => {
    expect(reminder).toContain('Residual 1270');
    expect(reminder).toContain('handle-calendar-select');
    expect(reminder).toContain('handleCalendarSelect');
    expect(reminder).toMatch(/function handleAbsoluteDateSelect\b/);
    const body = reminder.match(/function handleAbsoluteDateSelect\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('handleCalendarSelect');
    expect(body).toContain('absoluteTime');
    expect(body).not.toContain('instanceof Date');
    expect(body).not.toContain("'toDate' in date");
    expect(body).not.toContain('formatDateToYMD(date)');
  });

  it('soft residual 1270 absoluteTime composition + recurrence endDate path stay distinct', () => {
    expect(reminder).toContain('Soft residual 1270');
    const body = reminder.match(/function handleAbsoluteDateSelect\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('getAbsoluteHour');
    expect(body).toContain('getAbsoluteMinute');
    expect(body).toContain('updateTriggers');

    expect(recurrence).toContain('Residual 1267');
    expect(recurrence).toMatch(/function handleEndDateCalendarSelect\b/);
    const endBody = recurrence.match(/function handleEndDateCalendarSelect\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(endBody).toContain('endDate.value');
    expect(endBody).not.toContain('absoluteTime');
  });

  it('runtime: sole empty/Date contracts still support Reminder dateStr capture', () => {
    let dateStr = 'seed';
    handleCalendarSelect(new Date(2026, 6, 24), (v) => {
      dateStr = v;
    });
    expect(dateStr).toBe('2026-07-24');
    handleCalendarSelect(null, (v) => {
      dateStr = v;
    });
    expect(dateStr).toBe('');
  });

  it('documents residual 1270 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'handle-absolute-date-select-dual.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1270');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('dual retired');
  });
});
