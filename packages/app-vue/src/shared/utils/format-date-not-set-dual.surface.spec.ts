import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
/**
 * Residual 1261: formatDateNotSet dual retired onto app-react shared sole.
 * - sole: packages/app-react/src/utils/format-date-not-set.ts
 * - consumers: AccountScreen + GoalDetailScreen (was local formatDate date-only + 'Not set')
 * Soft residual 1261 / 1240:
 * - TaskDetailScreen: toLocaleString + 'Not set'
 * - GoalCompareScreen: toLocaleDateString + '-' (Residual 1240 keep-boundary)
 * - formatDateUnknown dual-retired sole (Residual 1264) remains separate
 * Soft residual 1240: vue goal i18n notSet / schedule N/A / reminder date-fns remain separate.
 * Soft residual 1258: handleCalendarSelect dual-retired sole remains separate.
 * Does not flip §13.2 checkboxes.
 */
describe('formatDateNotSet dual retired (residual 1261)', () => {
  const dir = __dirname;
  const reactUtils = resolve(dir, '../../../../app-react/src/utils');
  const reactScreens = resolve(dir, '../../../../app-react/src/screens');
  const sole = readFileSync(resolve(reactUtils, 'format-date-not-set.ts'), 'utf8');
  const account = readFileSync(resolve(reactScreens, 'AccountScreen.tsx'), 'utf8');
  const goalDetail = readFileSync(resolve(reactScreens, 'GoalDetailScreen.tsx'), 'utf8');
  const taskDetail = readFileSync(resolve(reactScreens, 'TaskDetailScreen.tsx'), 'utf8');
  const goalCompare = readFileSync(resolve(reactScreens, 'GoalCompareScreen.tsx'), 'utf8');

  // Runtime import via createRequire so vitest in app-vue can load the TS sole through path.
  // Prefer dynamic path relative require of compiled-free source via vitest transform: import from absolute path.
  it('owns sole formatDateNotSet body (Residual 1261)', () => {
    expect(sole).toContain('Residual 1261');
    expect(sole).toMatch(/export function formatDateNotSet\b/);
    expect(sole).toContain("'Not set'");
    expect(sole).toContain('toLocaleDateString()');
    const body = sole.match(/export function formatDateNotSet\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('timestamp: number | null');
    expect(body).not.toContain('toLocaleString()');
    expect(body).not.toContain("return '-'");
    expect(body).not.toContain("'Unknown'");
  });

  it('retires Account/GoalDetail dual bodies onto shared sole', () => {
    for (const [label, source] of [
      ['account', account],
      ['goalDetail', goalDetail],
    ] as const) {
      expect(source, label).toContain('Residual 1261');
      expect(source, label).toContain('format-date-not-set');
      expect(source, label).toContain('formatDateNotSet');
      expect(source, label).not.toMatch(/function formatDate\b/);
      expect(source, label).not.toMatch(
        /function formatDate\b[\s\S]*?'Not set'[\s\S]*?toLocaleDateString/,
      );
    }
  });

  it('soft residual 1261 task datetime Not set + goal compare "-" stay separate', () => {
    expect(taskDetail).toContain('Soft residual 1261');
    const taskBody = taskDetail.match(/function formatDate\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(taskBody).toContain("'Not set'");
    expect(taskBody).toContain('toLocaleString()');
    expect(taskBody).not.toContain('toLocaleDateString()');
    expect(taskDetail).not.toContain('format-date-not-set');

    expect(goalCompare).toContain('Residual 1240 keep-boundary');
    const compareBody = goalCompare.match(/function formatDate\([\s\S]*?\n  \}/)?.[0] ?? '';
    expect(compareBody).toContain("'-'");
    expect(compareBody).toContain('toLocaleDateString()');
    expect(compareBody).not.toContain("'Not set'");
    expect(goalCompare).not.toContain('format-date-not-set');
  });

  it('runtime: sole maps empty to Not set and formats date-only locale string', async () => {
    const { formatDateNotSet } = await import(
      '../../../../app-react/src/utils/format-date-not-set.ts'
    );
    expect(formatDateNotSet(null)).toBe('Not set');
    const ts = new Date(2026, 6, 24).getTime();
    expect(formatDateNotSet(ts)).toBe(new Date(ts).toLocaleDateString());
    expect(formatDateNotSet(ts)).not.toBe(new Date(ts).toLocaleString());
  });

  it('documents residual 1261 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'format-date-not-set-dual.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1261');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('dual retired');
  });
});
