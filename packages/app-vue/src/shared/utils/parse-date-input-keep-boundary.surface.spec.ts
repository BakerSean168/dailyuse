import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1225: parseDateInput keep-boundary (vue task YMD getTime vs react goal trim+Date.parse).
 * - app-vue TimeConfigSection: falsy empty → null; Date(dateStr+'T00:00:00').getTime() (no trim/NaN)
 * - app-react GoalEditorScreen: trim; empty → null; Date.parse; isNaN → null
 * Soft residual 1210: formatDateToInput keep-boundary remains separate.
 * Soft residual 1222: getStatusLabel keep-boundary remains separate.
 * Does not flip §13.2 checkboxes.
 */
describe('parseDateInput keep-boundary (residual 1225)', () => {
  const dir = __dirname;
  const vue = readFileSync(
    resolve(
      dir,
      '../../modules/task/components/TaskTemplateForm/sections/TimeConfigSection.vue',
    ),
    'utf8',
  );
  const react = readFileSync(
    resolve(dir, '../../../../app-react/src/screens/GoalEditorScreen.tsx'),
    'utf8',
  );

  it('owns Residual 1225 keep-boundary markers on app-vue task parseDateInput', () => {
    expect(vue).toContain('Residual 1225 keep-boundary');
    expect(vue).toMatch(/const parseDateInput\b/);
    expect(vue).toContain("dateStr + 'T00:00:00'");
    expect(vue).toContain('.getTime()');
    const body = vue.match(/const parseDateInput = \([\s\S]*?\n\};/)?.[0] ?? '';
    expect(body).toContain('if (!dateStr)');
    expect(body).toContain('getTime()');
    expect(body).not.toContain('.trim()');
    expect(body).not.toContain('Date.parse');
    expect(body).not.toContain('Number.isNaN');
  });

  it('differs from app-react goal parseDateInput trim+Date.parse (no force-merge)', () => {
    expect(react).toContain('Residual 1225 keep-boundary');
    expect(react).toMatch(/function parseDateInput\b/);
    expect(react).toContain('Soft residual 1225');
    expect(react).toContain('.trim()');
    expect(react).toContain('Date.parse');
    expect(react).toContain('Number.isNaN');
    const body = react.match(/function parseDateInput\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('normalized');
    expect(body).toContain('Date.parse');
    expect(body).not.toContain('getTime()');
    expect(body).not.toContain("dateStr + 'T00:00:00'");
  });

  it('runtime: documents falsy getTime vs trim Date.parse contracts via body shape', () => {
    function vueParseDateInput(dateStr: string): number | null {
      if (!dateStr) return null;
      return new Date(dateStr + 'T00:00:00').getTime();
    }
    function reactParseDateInput(value: string): number | null {
      const normalized = value.trim();
      if (normalized.length === 0) {
        return null;
      }
      const timestamp = Date.parse(`${normalized}T00:00:00`);
      return Number.isNaN(timestamp) ? null : timestamp;
    }
    expect(vueParseDateInput('')).toBeNull();
    expect(reactParseDateInput('')).toBeNull();
    expect(reactParseDateInput('   ')).toBeNull();
    // whitespace-only is truthy in vue path → Date parse of '   T00:00:00' → NaN number
    expect(Number.isNaN(vueParseDateInput('   ') as number)).toBe(true);
    const ymd = '2026-07-24';
    const vueTs = vueParseDateInput(ymd);
    const reactTs = reactParseDateInput(ymd);
    expect(typeof vueTs).toBe('number');
    expect(typeof reactTs).toBe('number');
    expect(vueTs).toBe(reactTs);
    expect(reactParseDateInput('not-a-date')).toBeNull();
    expect(Number.isNaN(vueParseDateInput('not-a-date') as number)).toBe(true);
  });

  it('soft residual 1210 formatDateToInput dual-retired onto product-time on same vue surface', () => {
    expect(vue).toContain('Residual 1210');
    expect(vue).toMatch(/const formatDateToInput\b/);
    expect(vue).toContain('getProductTime');
    expect(vue).toContain('dateToYmd');
  });

  it('documents residual 1225 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'parse-date-input-keep-boundary.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1225');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
