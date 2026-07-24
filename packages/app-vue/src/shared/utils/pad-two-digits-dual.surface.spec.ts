import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { padTwoDigits } from './pad-two-digits';
import { formatHHmmParts } from './format-hhmm-parts';

/**
 * Residual 1312: multi-site two-digit padStart dual retired onto padTwoDigits sole.
 * - sole: packages/app-vue/src/shared/utils/pad-two-digits.ts
 * - consumers: TimeConfigSection, ReminderSection, CreateScheduleDialog hour/minute options + parts
 * Soft residual: ScheduleFormDemo datetime-local composition stays separate
 * Does not flip §13.2 checkboxes.
 */
describe('padTwoDigits dual retired (residual 1312)', () => {
  const dir = __dirname;
  const sole = readFileSync(resolve(dir, 'pad-two-digits.ts'), 'utf8');
  const timeConfig = readFileSync(
    resolve(dir, '../../modules/task/components/TaskTemplateForm/sections/TimeConfigSection.vue'),
    'utf8',
  );
  const reminder = readFileSync(
    resolve(dir, '../../modules/task/components/TaskTemplateForm/sections/ReminderSection.vue'),
    'utf8',
  );
  const createSchedule = readFileSync(
    resolve(dir, '../../modules/schedule/components/CreateScheduleDialog.vue'),
    'utf8',
  );

  it('owns sole padTwoDigits body (Residual 1312)', () => {
    expect(sole).toContain('Residual 1312');
    expect(sole).toMatch(/export function padTwoDigits\b/);
    const body = sole.match(/export function padTwoDigits\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('n: number');
    expect(body).toContain("padStart(2, '0')");
  });

  it('retires TimeConfig / Reminder / CreateSchedule dual bodies onto sole', () => {
    for (const [label, source] of [
      ['timeConfig', timeConfig],
      ['reminder', reminder],
      ['createSchedule', createSchedule],
    ] as const) {
      expect(source, label).toContain('Residual 1312');
      expect(source, label).toContain('padTwoDigits');
      expect(source, label).toContain('hourOptions');
      expect(source, label).toContain('minuteOptions');
      // option lists should not inline padStart
      const hourLine = source.match(/const hourOptions = [^\n]+/)?.[0] ?? '';
      const minuteLine = source.match(/const minuteOptions = [^\n]+/)?.[0] ?? '';
      expect(hourLine, label).toContain('padTwoDigits');
      expect(hourLine, label).not.toContain('padStart');
      expect(minuteLine, label).toContain('padTwoDigits');
      expect(minuteLine, label).not.toContain('padStart');
    }

    const split = timeConfig.match(/function splitMinutes\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(split).toContain('padTwoDigits');
    expect(split).not.toContain('padStart');

    // Reminder absolute hour/minute extractors
    expect(reminder).toContain('function getAbsoluteHour');
    expect(reminder).toContain('function getAbsoluteMinute');
    const hourFn = reminder.match(/function getAbsoluteHour\([\s\S]*?\n\}/)?.[0] ?? '';
    const minuteFn = reminder.match(/function getAbsoluteMinute\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(hourFn).toContain('padTwoDigits');
    expect(hourFn).not.toContain('padStart');
    expect(minuteFn).toContain('padTwoDigits');
    expect(minuteFn).not.toContain('padStart');
  });

  it('soft residual: ScheduleFormDemo datetime-local composition stays separate', () => {
    const demo = readFileSync(
      resolve(dir, '../../modules/schedule/components/ScheduleFormDemo.vue'),
      'utf8',
    );
    expect(demo).toContain('padStart');
    expect(demo).not.toContain('padTwoDigits');
  });

  it('runtime: padTwoDigits and formatHHmmParts composition agree', () => {
    expect(padTwoDigits(0)).toBe('00');
    expect(padTwoDigits(9)).toBe('09');
    expect(padTwoDigits(23)).toBe('23');
    expect(formatHHmmParts(9, 5)).toBe(`${padTwoDigits(9)}:${padTwoDigits(5)}`);
  });

  it('documents residual 1312 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'pad-two-digits-dual.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1312');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('dual retired');
  });
});
