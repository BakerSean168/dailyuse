import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatDisplayDate } from './format-display-date';

/**
 * Residual 1249: formatDisplayDate dual retired onto app-vue shared sole.
 * - sole: packages/app-vue/src/shared/utils/format-display-date.ts
 * - consumers: CreateScheduleDialog, TimeConfigSection, ReminderSection, RecurrenceSection
 * Soft residual 1249: parseToDate / parseInputToDate local YYYY-MM-DD→Date helpers stay co-located.
 * Soft residual 1240: formatDate keep-boundary remains separate (timestamp display, not YYYY-MM-DD).
 * Soft residual 1246: describeConflict keep-boundary remains separate.
 * Does not flip §13.2 checkboxes.
 */
describe('formatDisplayDate dual retired (residual 1249)', () => {
  const dir = __dirname;
  const sole = readFileSync(resolve(dir, 'format-display-date.ts'), 'utf8');
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

  it('owns sole formatDisplayDate body (Residual 1249)', () => {
    expect(sole).toContain('Residual 1249');
    expect(sole).toMatch(/export function formatDisplayDate\b/);
    expect(sole).toContain("dateStr + 'T00:00:00'");
    expect(sole).toContain("month: 'short'");
    const body = sole.match(/export function formatDisplayDate\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('locale: string');
    expect(body).toContain("return ''");
    expect(body).toContain('toLocaleDateString(locale');
  });

  it('retires schedule/task dual bodies onto shared sole', () => {
    for (const [label, source] of [
      ['schedule', schedule],
      ['timeConfig', timeConfig],
      ['reminder', reminder],
      ['recurrence', recurrence],
    ] as const) {
      expect(source, label).toContain('Residual 1249');
      expect(source, label).toContain('format-display-date');
      expect(source, label).toContain('formatDisplayDate');
      expect(source, label).not.toMatch(/function formatDisplayDate\b/);
      expect(source, label).not.toMatch(/function formatEndDateDisplay\b/);
      // no local display helper body (toLocaleDateString short month) remains
      expect(source, label).not.toMatch(
        /function format(?:DisplayDate|EndDateDisplay)\b[\s\S]*?toLocaleDateString/,
      );
    }
    expect(schedule).toContain('formatDisplayDate(formData.startDate, locale)');
    expect(timeConfig).toContain('formatDisplayDate(startDate, locale)');
    expect(reminder).toContain('formatDisplayDate(getAbsoluteDatePart(trigger.absoluteTime)!, locale)');
    expect(recurrence).toContain('formatDisplayDate(endDate, locale)');
  });

  it('soft residual 1249 local parseToDate/parseInputToDate stay co-located', () => {
    expect(schedule).toMatch(/function parseToDate\b/);
    expect(timeConfig).toMatch(/function parseInputToDate\b/);
    const parseSchedule = schedule.match(/function parseToDate\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(parseSchedule).toContain("dateStr + 'T00:00:00'");
    expect(parseSchedule).toContain('undefined');
  });

  it('runtime: sole formats YYYY-MM-DD empty and locale short month', () => {
    expect(formatDisplayDate('', 'en-US')).toBe('');
    const en = formatDisplayDate('2026-07-24', 'en-US');
    expect(en).toMatch(/2026/);
    expect(en).toMatch(/Jul|July|24/);
    const zh = formatDisplayDate('2026-07-24', 'zh-CN');
    expect(zh).toMatch(/2026/);
    expect(zh).toMatch(/7|24/);
  });

  it('documents residual 1249 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'format-display-date-dual.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1249');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('dual retired');
  });
});
