import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { padTwoDigits } from './pad-two-digits';
import { formatHHmmParts } from './format-hhmm-parts';
import { formatLocalHHmm } from './format-local-hhmm';
import { formatHour } from './format-hour';
import { formatDateToYMD } from './format-date-to-ymd';

/**
 * Residual 1318: multi-sole padStart dual retired onto padTwoDigits composition.
 * - formatHHmmParts / formatLocalHHmm / formatHour / formatDateToYMD bodies compose padTwoDigits
 * - join contracts remain on Residual 1297/1294/1276/1252 soles
 * Soft residual: toLocalDateKey Date|number padStart body; setting/goal multi-site formatTime keep-boundary.
 * Does not flip §13.2 checkboxes.
 */
describe('padTwoDigits multi-sole compose dual retired (residual 1318)', () => {
  const dir = __dirname;
  const pad = readFileSync(resolve(dir, 'pad-two-digits.ts'), 'utf8');
  const parts = readFileSync(resolve(dir, 'format-hhmm-parts.ts'), 'utf8');
  const local = readFileSync(resolve(dir, 'format-local-hhmm.ts'), 'utf8');
  const hour = readFileSync(resolve(dir, 'format-hour.ts'), 'utf8');
  const ymd = readFileSync(resolve(dir, 'format-date-to-ymd.ts'), 'utf8');

  it('owns Residual 1318 composition on four soles onto padTwoDigits', () => {
    expect(pad).toContain('Residual 1318');
    expect(pad).toMatch(/export function padTwoDigits\b/);
    for (const [label, source] of [
      ['parts', parts],
      ['local', local],
      ['hour', hour],
      ['ymd', ymd],
    ] as const) {
      expect(source, label).toContain('Residual 1318');
      expect(source, label).toContain('padTwoDigits');
      expect(source, label).toContain("from './pad-two-digits'");
      const body =
        source.match(
          /export function (?:formatHHmmParts|formatLocalHHmm|formatHour|formatDateToYMD)\([\s\S]*?\n\}/,
        )?.[0] ?? '';
      expect(body, label).toContain('padTwoDigits');
      expect(body, label).not.toContain('padStart');
    }
  });

  it('keeps Residual 1297/1294/1276/1252 join contracts on respective soles', () => {
    expect(parts).toContain('Residual 1297');
    expect(parts).toMatch(/export function formatHHmmParts\b/);
    expect(local).toContain('Residual 1294');
    expect(local).toMatch(/export function formatLocalHHmm\b/);
    expect(hour).toContain('Residual 1276');
    expect(hour).toContain(':00');
    expect(ymd).toContain('Residual 1252');
    expect(ymd).toContain('`${y}-${m}-${d}`');
  });

  it('soft residual: toLocalDateKey padStart + setting/goal formatTime keep-boundary', () => {
    const calendar = readFileSync(
      resolve(dir, '../../modules/schedule/composables/useCalendarView.ts'),
      'utf8',
    );
    const key = calendar.match(/export function toLocalDateKey\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(key).toContain("padStart(2, '0')");
    expect(key).not.toContain('padTwoDigits');
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

  it('runtime: composed soles agree with padTwoDigits', () => {
    expect(formatHHmmParts(9, 5)).toBe(`${padTwoDigits(9)}:${padTwoDigits(5)}`);
    expect(formatHour(9)).toBe(`${padTwoDigits(9)}:00`);
    const ms = new Date(2026, 6, 24, 9, 5, 0).getTime();
    expect(formatLocalHHmm(ms)).toBe(`${padTwoDigits(9)}:${padTwoDigits(5)}`);
    expect(formatDateToYMD(new Date(ms))).toBe(
      `2026-${padTwoDigits(7)}-${padTwoDigits(24)}`,
    );
  });

  it('documents residual 1318 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'pad-two-digits-compose-dual.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1318');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('dual retired');
  });
});
