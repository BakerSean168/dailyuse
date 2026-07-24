import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { handleCalendarSelect } from './handle-calendar-select';

/**
 * Residual 1267: handleEndDateCalendarSelect dual retired onto handleCalendarSelect sole.
 * - sole: packages/app-vue/src/shared/utils/handle-calendar-select.ts (Residual 1258)
 * - consumer: RecurrenceSection handleEndDateCalendarSelect → setter(endDate ref)
 * Soft residual 1267 / 1258:
 * - ReminderSection inline calendar dateStr + absoluteTime composition (no force-merge)
 * Soft residual 1255: endDateAsDate inline YYYY-MM-DD→Date remains co-located
 * Soft residual 1252: formatDateToYMD dual-retired sole remains separate
 * Does not flip §13.2 checkboxes.
 */
describe('handleEndDateCalendarSelect dual retired (residual 1267)', () => {
  const dir = __dirname;
  const sole = readFileSync(resolve(dir, 'handle-calendar-select.ts'), 'utf8');
  const recurrence = readFileSync(
    resolve(dir, '../../modules/task/components/TaskTemplateForm/sections/RecurrenceSection.vue'),
    'utf8',
  );
  const reminder = readFileSync(
    resolve(dir, '../../modules/task/components/TaskTemplateForm/sections/ReminderSection.vue'),
    'utf8',
  );

  it('owns Residual 1267 lock on handleCalendarSelect sole consumer notes', () => {
    expect(sole).toContain('Residual 1258');
    expect(sole).toContain('RecurrenceSection');
    expect(sole).toContain('Residual 1267');
    expect(sole).toMatch(/export function handleCalendarSelect\b/);
  });

  it('retires Recurrence handleEndDateCalendarSelect dual body onto sole', () => {
    expect(recurrence).toContain('Residual 1267');
    expect(recurrence).toContain('handle-calendar-select');
    expect(recurrence).toContain('handleCalendarSelect');
    expect(recurrence).toMatch(/function handleEndDateCalendarSelect\b/);
    const body = recurrence.match(/function handleEndDateCalendarSelect\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('handleCalendarSelect');
    expect(body).toContain('endDate.value');
    expect(body).not.toContain('formatDateToYMD');
    expect(body).not.toContain('instanceof Date');
    expect(recurrence).not.toContain("from '../../../../../shared/utils/format-date-to-ymd'");
  });

  it('soft residual 1267 reminder calendar composition stays separate', () => {
    expect(reminder).toContain('Soft residual 1258');
    expect(reminder).toContain('formatDateToYMD(date)');
    expect(reminder).toContain('absoluteTime');
    expect(reminder).not.toContain('handle-calendar-select');
    expect(reminder).not.toContain('Residual 1267');
  });

  it('runtime: sole setter path still maps Date / empty for endDate-style use', () => {
    let value = 'seed';
    handleCalendarSelect(new Date(2026, 6, 24), (v) => {
      value = v;
    });
    expect(value).toBe('2026-07-24');
    handleCalendarSelect(null, (v) => {
      value = v;
    });
    expect(value).toBe('');
  });

  it('documents residual 1267 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'handle-end-date-calendar-select-dual.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1267');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('dual retired');
  });
});
