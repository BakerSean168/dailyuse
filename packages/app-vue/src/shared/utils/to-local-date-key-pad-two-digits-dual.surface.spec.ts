import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { padTwoDigits } from './pad-two-digits';
import { toLocalDateKey } from '../../modules/schedule/composables/useCalendarView';
import { formatDateToYMD } from './format-date-to-ymd';

/**
 * Residual 1321: toLocalDateKey padStart dual retired onto padTwoDigits composition.
 * - sole: useCalendarView.ts#toLocalDateKey (Date|number → YYYY-MM-DD key contract stays Residual 1282)
 * Soft residual: setting/goal multi-site formatTime keep-boundary (relative/date-fns/toLocaleString).
 * Does not flip §13.2 checkboxes.
 */
describe('toLocalDateKey → padTwoDigits dual retired (residual 1321)', () => {
  const dir = __dirname;
  const calendar = readFileSync(
    resolve(dir, '../../modules/schedule/composables/useCalendarView.ts'),
    'utf8',
  );
  const pad = readFileSync(resolve(dir, 'pad-two-digits.ts'), 'utf8');

  it('owns Residual 1321 composition on toLocalDateKey onto padTwoDigits', () => {
    expect(calendar).toContain('Residual 1321');
    expect(calendar).toContain('Residual 1282');
    expect(pad).toContain('Residual 1321');
    expect(pad).toMatch(/export function padTwoDigits\b/);
    const body = calendar.match(/export function toLocalDateKey\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('padTwoDigits');
    expect(body).not.toContain('padStart');
    expect(body).toContain('Date | number');
    expect(body).toContain("typeof value === 'number'");
    expect(calendar).toContain("from '../../../shared/utils/pad-two-digits'");
  });

  it('keeps Residual 1282 Date|number key contract separate from formatDateToYMD Date-only sole', () => {
    const ymd = readFileSync(resolve(dir, 'format-date-to-ymd.ts'), 'utf8');
    expect(ymd).toContain('Residual 1252');
    const ymdBody = ymd.match(/export function formatDateToYMD\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(ymdBody).toContain('date: Date');
    expect(ymdBody).not.toContain('number');
    // Date branch parity
    expect(formatDateToYMD(new Date(2026, 6, 24))).toBe(toLocalDateKey(new Date(2026, 6, 24)));
  });

  it('soft residual: setting/goal multi-site formatTime keep-boundary stays separate', () => {
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
    expect(setting).not.toContain('toLocalDateKey');
    expect(progress).toContain('Soft residual 1237');
    expect(progress).not.toContain('formatLocalHHmm');
    expect(progress).not.toContain('toLocalDateKey');
  });

  it('runtime: toLocalDateKey agrees with padTwoDigits composition', () => {
    const d = new Date(2026, 6, 24);
    expect(toLocalDateKey(d)).toBe(
      `${d.getFullYear()}-${padTwoDigits(d.getMonth() + 1)}-${padTwoDigits(d.getDate())}`,
    );
    expect(toLocalDateKey(new Date(2026, 0, 5).getTime())).toBe('2026-01-05');
  });

  it('documents residual 1321 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'to-local-date-key-pad-two-digits-dual.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1321');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('dual retired');
  });
});
