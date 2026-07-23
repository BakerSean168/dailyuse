import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readNestedNumber } from './read-nested-number';

/**
 * Residual 1009: readNestedNumber dual retired (API + Desktop automation executors).
 * Sole body in @dailyuse/utils/shared/read-nested-number.
 * Soft residual 1034: tip focused suite numbers track Residual 1034 evidence tip (307/1331).
 * Soft residual 1011: previewText dual retired (utils sole; API maxLength 200 call sites).
 * Does not flip §13.2 checkboxes.
 */
describe('readNestedNumber dual retired (residual 1009)', () => {
  const sharedDir = __dirname;
  const sole = readFileSync(resolve(sharedDir, 'read-nested-number.ts'), 'utf8');
  const index = readFileSync(resolve(sharedDir, 'index.ts'), 'utf8');
  const api = readFileSync(
    resolve(
      sharedDir,
      '../../../../apps/api/src/modules/ai/backend-automation-tool-executor.adapter.ts',
    ),
    'utf8',
  );
  const desktop = readFileSync(
    resolve(
      sharedDir,
      '../../../../apps/desktop/src/main/modules/ai/desktop-automation-tool-executor.adapter.ts',
    ),
    'utf8',
  );

  it('owns sole readNestedNumber helper body and shared barrel export', () => {
    expect(sole).toContain('Residual 1009');
    expect(sole).toMatch(/export function readNestedNumber\b/);
    expect(sole).toContain("typeof current !== 'object'");
    expect(sole).toContain("typeof current === 'number'");
    expect(index).toContain("export * from './read-nested-number'");
  });

  it('API + Desktop automation executors import sole without local dual bodies', () => {
    for (const [label, source] of [
      ['api', api],
      ['desktop', desktop],
    ] as const) {
      expect(source, label).toContain('Residual 1009');
      expect(source, label).toContain("from '@dailyuse/utils/shared'");
      expect(source, label).toMatch(/readNestedNumber/);
      expect(source, label).not.toMatch(/function readNestedNumber\b/);
      expect(source, label).toContain("readNestedNumber(context.dashboard, ['stats', 'activeGoals'])");
      expect(source, label).toContain("readNestedNumber(context.taskDashboard, ['summary', 'overdue'])");
    }
  });

  it('API previewText dual retired to utils sole (residual 1011)', () => {
    expect(api).toContain('Residual 1011');
    expect(api).toContain("from '@dailyuse/utils/shared'");
    expect(api).not.toMatch(/function previewText\b/);
    expect(api).toMatch(/previewText\([^)]+,\s*200\)/);
    const aiReexport = readFileSync(
      resolve(sharedDir, '../../../ai/src/shared/preview-text.ts'),
      'utf8',
    );
    const utilsSole = readFileSync(resolve(sharedDir, 'preview-text.ts'), 'utf8');
    expect(aiReexport).toContain('Residual 1011');
    expect(aiReexport).toContain("export { previewText } from '@dailyuse/utils/shared'");
    expect(utilsSole).toContain('Residual 1011');
    expect(utilsSole).toContain('maxLength = 240');
  });

  it('walks nested number paths and returns 0 for missing/non-number leaves', () => {
    const source = {
      stats: { activeGoals: 3 },
      summary: { overdue: 2 },
      bad: { value: 'nope' },
    };
    expect(readNestedNumber(source, ['stats', 'activeGoals'])).toBe(3);
    expect(readNestedNumber(source, ['summary', 'overdue'])).toBe(2);
    expect(readNestedNumber(source, ['missing', 'x'])).toBe(0);
    expect(readNestedNumber(source, ['bad', 'value'])).toBe(0);
    expect(readNestedNumber(null, ['stats'])).toBe(0);
    expect(readNestedNumber(source, [])).toBe(0);
  });
});
