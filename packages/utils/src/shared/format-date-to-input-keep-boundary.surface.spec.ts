import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1210: formatDateToInput keep-boundary (utils Date+date-fns vs app-vue timestamp YMD).
 * - utils date.ts: Date → format(dateObj, 'yyyy-MM-dd'); falsy → ''
 * - app-vue TimeConfigSection: number timestamp → formatDateToYMD (padStart local)
 * Soft residual 1207: formatMessageTime keep-boundary remains separate.
 * Soft residual 1204: formatDateTime keep-boundary remains separate.
 * Does not flip §13.2 checkboxes.
 */
describe('formatDateToInput keep-boundary (residual 1210)', () => {
  const dir = __dirname;
  const utils = readFileSync(resolve(dir, 'date.ts'), 'utf8');
  const vue = readFileSync(
    resolve(
      dir,
      '../../../app-vue/src/modules/task/components/TaskTemplateForm/sections/TimeConfigSection.vue',
    ),
    'utf8',
  );

  it('owns Residual 1210 keep-boundary markers on utils Date+date-fns formatDateToInput', () => {
    expect(utils).toContain('Residual 1210 keep-boundary');
    expect(utils).toMatch(/export function formatDateToInput\b/);
    expect(utils).toContain('dateObj: Date');
    expect(utils).toContain("format(dateObj, 'yyyy-MM-dd')");
    const body = utils.match(/export function formatDateToInput\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain("return ''");
    expect(body).toContain('format(');
    expect(body).not.toContain('formatDateToYMD');
    expect(body).not.toContain('timestamp: number');
    expect(body).not.toContain('padStart');
  });

  it('differs from app-vue task timestamp→YMD formatDateToInput (no force-merge)', () => {
    expect(vue).toContain('Residual 1210 keep-boundary');
    expect(vue).toMatch(/const formatDateToInput\b/);
    expect(vue).toContain('Soft residual 1210');
    expect(vue).toContain('timestamp: number');
    expect(vue).toContain('formatDateToYMD');
    const body = vue.match(/const formatDateToInput\s*=\s*\([\s\S]*?\};/)?.[0] ?? '';
    expect(body).toContain('new Date(timestamp)');
    expect(body).toContain('formatDateToYMD');
    expect(body).not.toContain("format(dateObj, 'yyyy-MM-dd')");
    expect(body).not.toContain('date-fns');
    expect(body).not.toContain("return ''");
  });

  it('runtime: documents Date+date-fns vs timestamp padStart contracts via body shape', () => {
    function utilsFormatDateToInput(dateObj: Date | null | undefined): string {
      if (!dateObj) return '';
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    function vueFormatDateToInput(timestamp: number): string {
      const date = new Date(timestamp);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    expect(utilsFormatDateToInput(null as unknown as Date)).toBe('');
    expect(utilsFormatDateToInput(undefined as unknown as Date)).toBe('');
    const fixed = new Date(2024, 0, 2);
    expect(utilsFormatDateToInput(fixed)).toBe('2024-01-02');
    expect(vueFormatDateToInput(fixed.getTime())).toBe('2024-01-02');
    // Input shape mismatch: utils wants Date; vue wants number timestamp.
    expect(utils).toContain('dateObj: Date');
    expect(vue).toContain('timestamp: number');
  });

  it('documents residual 1210 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'format-date-to-input-keep-boundary.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1210');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
