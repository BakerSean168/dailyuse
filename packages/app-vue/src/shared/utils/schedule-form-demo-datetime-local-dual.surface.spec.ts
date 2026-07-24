import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatDateToYMD } from './format-date-to-ymd';
import { formatLocalHHmm } from './format-local-hhmm';

/**
 * Residual 1315: ScheduleFormDemo datetime-local composition dual retired onto
 * formatDateToYMD (YYYY-MM-DD) + formatLocalHHmm (HH:mm) soles.
 * Soft residual: formatDateToYMD / formatLocalHHmm / formatHHmmParts / formatHour
 * internal padStart bodies (padTwoDigits compose optional); setting/goal multi-site
 * formatTime keep-boundary; toLocalDateKey Date|number sole stays separate.
 * Does not flip §13.2 checkboxes.
 */
describe('ScheduleFormDemo datetime-local dual retired (residual 1315)', () => {
  const dir = __dirname;
  const demo = readFileSync(
    resolve(dir, '../../modules/schedule/components/ScheduleFormDemo.vue'),
    'utf8',
  );
  const ymd = readFileSync(resolve(dir, 'format-date-to-ymd.ts'), 'utf8');
  const hhmm = readFileSync(resolve(dir, 'format-local-hhmm.ts'), 'utf8');

  it('owns Residual 1315 composition on formatDateTimeToInput', () => {
    expect(demo).toContain('Residual 1315');
    expect(demo).toContain('formatDateToYMD');
    expect(demo).toContain('formatLocalHHmm');
    expect(ymd).toMatch(/export function formatDateToYMD\b/);
    expect(hhmm).toMatch(/export function formatLocalHHmm\b/);
    const body = demo.match(/function formatDateTimeToInput\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('formatDateToYMD');
    expect(body).toContain('formatLocalHHmm');
    expect(body).not.toContain('padStart');
    expect(body).not.toContain('getFullYear');
    expect(body).not.toContain('getHours');
    expect(body).not.toContain('getMinutes');
  });

  it('keeps formatDateToYMD Date-only and formatLocalHHmm ms soles separate', () => {
    expect(ymd).toContain('Residual 1252');
    expect(ymd).not.toContain('formatLocalHHmm');
    expect(hhmm).toContain('Residual 1294');
    expect(hhmm).not.toContain('formatDateToYMD');
  });

  it('soft residual: padTwoDigits compose optional; setting/goal formatTime keep-boundary', () => {
    const parts = readFileSync(resolve(dir, 'format-hhmm-parts.ts'), 'utf8');
    const hour = readFileSync(resolve(dir, 'format-hour.ts'), 'utf8');
    expect(parts).toContain("padStart(2, '0')");
    expect(hour).toContain("padStart(2, '0')");
    expect(ymd).toContain("padStart(2, '0')");
    expect(hhmm).toContain("padStart(2, '0')");
    const setting = readFileSync(
      resolve(dir, '../../modules/setting/components/SettingAdvancedActions.vue'),
      'utf8',
    );
    const progress = readFileSync(
      resolve(dir, '../../modules/goal/components/ProgressBreakdownPanel.vue'),
      'utf8',
    );
    expect(setting).toContain('Soft residual 1237');
    expect(setting).not.toContain('formatLocalHHmm');
    expect(progress).toContain('Soft residual 1237');
    expect(progress).not.toContain('formatLocalHHmm');
  });

  it('runtime: datetime-local composition agrees with soles', () => {
    const ms = new Date(2026, 6, 24, 9, 5, 0).getTime();
    expect(`${formatDateToYMD(new Date(ms))}T${formatLocalHHmm(ms)}`).toBe('2026-07-24T09:05');
  });

  it('documents residual 1315 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'schedule-form-demo-datetime-local-dual.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1315');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('dual retired');
  });
});
