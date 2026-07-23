import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readNestedNumber } from './read-nested-number';

/**
 * Residual 1009: readNestedNumber dual retired (API + Desktop automation executors).
 * Sole body in @dailyuse/utils/shared/read-nested-number.
 * Soft residual 1010: tip focused suite numbers track Residual 1010 evidence tip (295/1283).
 * Soft residual: API backend-automation still has local previewText (default maxLength 200)
 *   vs packages/ai shared previewText sole (residual 995, default 240) — keep-boundary
 *   until apps import a public export path without package boundary churn.
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

  it('API previewText remains keep-boundary vs AI shared sole (residual 995)', () => {
    expect(api).toMatch(/function previewText\b/);
    expect(api).toContain('maxLength = 200');
    const aiSole = readFileSync(
      resolve(sharedDir, '../../../ai/src/shared/preview-text.ts'),
      'utf8',
    );
    expect(aiSole).toContain('Residual 995');
    expect(aiSole).toContain('maxLength = 240');
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
