import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseToDate } from './parse-to-date';

/**
 * Residual 1255: parseToDate dual retired onto app-vue shared sole.
 * - sole: packages/app-vue/src/shared/utils/parse-to-date.ts
 * - consumers: CreateScheduleDialog (parseToDate), TimeConfigSection (was parseInputToDate)
 * Soft residual 1255:
 * - RecurrenceSection endDateAsDate inline YYYY-MM-DD→Date
 * - TimeConfig dateStr→getTime helper still co-located
 * Soft residual 1249/1252: formatDisplayDate / formatDateToYMD dual-retired soles remain separate.
 * Soft residual 1252 surface soft residual parse* notes superseded by this dual-retire.
 * Does not flip §13.2 checkboxes.
 */
describe('parseToDate dual retired (residual 1255)', () => {
  const dir = __dirname;
  const sole = readFileSync(resolve(dir, 'parse-to-date.ts'), 'utf8');
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

  it('owns sole parseToDate body (Residual 1255)', () => {
    expect(sole).toContain('Residual 1255');
    expect(sole).toMatch(/export function parseToDate\b/);
    expect(sole).toContain("dateStr + 'T00:00:00'");
    const body = sole.match(/export function parseToDate\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('undefined');
    expect(body).toContain('new Date');
  });

  it('retires schedule/task dual bodies onto shared sole', () => {
    expect(schedule).toContain('Residual 1255');
    expect(schedule).toContain('parse-to-date');
    expect(schedule).toContain('parseToDate');
    expect(schedule).not.toMatch(/function parseToDate\b/);

    expect(timeConfig).toContain('Residual 1255');
    expect(timeConfig).toContain('parse-to-date');
    expect(timeConfig).toContain('parseToDate');
    expect(timeConfig).not.toMatch(/function parseInputToDate\b/);
    expect(timeConfig).not.toMatch(/function parseToDate\b/);
  });

  it('soft residual 1255 recurrence endDateAsDate + timeConfig getTime stay co-located', () => {
    expect(recurrence).toContain('Soft residual 1255');
    expect(recurrence).toContain("endDate.value + 'T00:00:00'");
    expect(recurrence).not.toContain('parse-to-date');

    expect(timeConfig).toContain("dateStr + 'T00:00:00').getTime()");
  });

  it('runtime: sole parses empty and local calendar day', () => {
    expect(parseToDate('')).toBeUndefined();
    const d = parseToDate('2026-07-24');
    expect(d).toBeInstanceOf(Date);
    expect(d!.getFullYear()).toBe(2026);
    expect(d!.getMonth()).toBe(6);
    expect(d!.getDate()).toBe(24);
  });

  it('documents residual 1255 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'parse-to-date-dual.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1255');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('dual retired');
  });
});
