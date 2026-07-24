import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1231: toTimeInput keep-boundary (task local HH:mm vs schedule UTC ISO slice).
 * - app-react TaskEditorScreen: falsy → '09:00'; getHours/getMinutes padStart (local)
 * - app-react ScheduleEventEditorScreen: falsy → ''; toISOString().slice(11,16) (UTC)
 * Soft residual 1231: utils formatTimeToInput Date+date-fns stays separate.
 * Soft residual 1228: toDateInput keep-boundary remains separate.
 * Does not flip §13.2 checkboxes.
 */
describe('toTimeInput keep-boundary (residual 1231)', () => {
  const dir = __dirname;
  const task = readFileSync(
    resolve(dir, '../../../../app-react/src/screens/TaskEditorScreen.tsx'),
    'utf8',
  );
  const schedule = readFileSync(
    resolve(dir, '../../../../app-react/src/screens/ScheduleEventEditorScreen.tsx'),
    'utf8',
  );
  const utils = readFileSync(
    resolve(dir, '../../../../utils/src/shared/date.ts'),
    'utf8',
  );

  it('owns Residual 1231 keep-boundary markers on task local toTimeInput', () => {
    expect(task).toContain('Residual 1231 keep-boundary');
    expect(task).toMatch(/function toTimeInput\b/);
    expect(task).toContain("return '09:00'");
    expect(task).toContain('getHours()');
    expect(task).toContain('getMinutes()');
    expect(task).toContain("padStart(2, '0')");
    const body = task.match(/function toTimeInput\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain("'09:00'");
    expect(body).toContain('getHours()');
    expect(body).not.toContain('toISOString()');
    expect(body).not.toContain('format(dateObj');
  });

  it('differs from schedule UTC ISO slice toTimeInput (no force-merge)', () => {
    expect(schedule).toContain('Residual 1231 keep-boundary');
    expect(schedule).toMatch(/function toTimeInput\b/);
    expect(schedule).toContain('Soft residual 1231');
    expect(schedule).toContain('toISOString().slice(11, 16)');
    const body = schedule.match(/function toTimeInput\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain("return ''");
    expect(body).toContain('toISOString()');
    expect(body).not.toContain('getHours()');
    expect(body).not.toContain("'09:00'");
    expect(body).not.toContain('padStart');
  });

  it('soft residual 1231 utils formatTimeToInput Date+date-fns stays separate', () => {
    expect(utils).toContain('Soft residual 1231');
    expect(utils).toMatch(/export function formatTimeToInput\b/);
    expect(utils).toContain("format(dateObj, 'HH:mm')");
    expect(utils).toContain('dateObj: Date');
    const body = utils.match(/export function formatTimeToInput\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('format(dateObj');
    expect(body).not.toContain('getHours()');
    expect(body).not.toContain('toISOString()');
    expect(body).not.toContain("'09:00'");
  });

  it('runtime: documents local padStart vs UTC slice vs date-fns contracts via body shape', () => {
    function taskToTimeInput(timestamp: number | null): string {
      if (!timestamp) {
        return '09:00';
      }
      const date = new Date(timestamp);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    function scheduleToTimeInput(timestamp: number | null | undefined): string {
      if (!timestamp) {
        return '';
      }
      return new Date(timestamp).toISOString().slice(11, 16);
    }
    expect(taskToTimeInput(null)).toBe('09:00');
    expect(scheduleToTimeInput(null)).toBe('');
    const utcNoon = Date.UTC(2026, 6, 24, 12, 30, 0);
    expect(scheduleToTimeInput(utcNoon)).toBe('12:30');
    // local path depends on host TZ; assert shape only
    expect(taskToTimeInput(utcNoon)).toMatch(/^\d{2}:\d{2}$/);
  });

  it('documents residual 1231 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'to-time-input-keep-boundary.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1231');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
