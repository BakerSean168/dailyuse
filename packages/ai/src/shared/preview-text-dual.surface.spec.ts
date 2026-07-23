import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { previewText } from './preview-text';

/**
 * Residual 995: previewText dual retired (AI goal/chat observability previews).
 * Residual 1011: sole body elevated to @dailyuse/utils/shared/preview-text;
 * this package re-exports so package-local import paths stay stable.
 * generate-ai-goal + automation/planning adapters + internal client import it
 * (call sites keep their maxLength args).
 * Soft residual 1020: tip focused suite numbers track Residual 1020 evidence tip (300/1303).
 * Soft residual 993: createStreamId dual retired (create-stream-id-dual.surface.spec.ts).
 * Does not flip §13.2 checkboxes.
 */
describe('previewText dual retired (residual 995 / elevated residual 1011)', () => {
  const dir = __dirname;
  const reexport = readFileSync(resolve(dir, 'preview-text.ts'), 'utf8');
  const sole = readFileSync(
    resolve(dir, '../../../utils/src/shared/preview-text.ts'),
    'utf8',
  );
  const generateGoal = readFileSync(
    resolve(dir, '../server/application/use-cases/commands/generate-ai-goal.use-case.ts'),
    'utf8',
  );
  const automation = readFileSync(
    resolve(
      dir,
      '../server/infrastructure/chat-execution/ai-service-goal-automation.adapter.ts',
    ),
    'utf8',
  );
  const planning = readFileSync(
    resolve(
      dir,
      '../server/infrastructure/chat-execution/ai-service-goal-planning.adapter.ts',
    ),
    'utf8',
  );
  const internal = readFileSync(
    resolve(dir, '../server/infrastructure/chat-execution/ai-service-internal-client.ts'),
    'utf8',
  );

  it('re-exports utils sole previewText helper body', () => {
    expect(reexport).toContain('Residual 995');
    expect(reexport).toContain('Residual 1011');
    expect(reexport).toContain("export { previewText } from '@dailyuse/utils/shared'");
    expect(reexport).not.toMatch(/export function previewText\b/);
    expect(sole).toContain('Residual 1011');
    expect(sole).toMatch(/export function previewText\b/);
    expect(sole).toContain("value.replace(/\\s+/g, ' ')");
    expect(sole).toContain('maxLength - 3');
    expect(sole).toContain('...');
    expect(sole).toContain('maxLength = 240');
  });

  it('consumers import package-local re-export without local dual bodies', () => {
    for (const [label, source, importPath] of [
      [
        'generate-ai-goal',
        generateGoal,
        "import { previewText } from '../../../../shared/preview-text'",
      ],
      [
        'automation',
        automation,
        "import { previewText } from '../../../shared/preview-text'",
      ],
      [
        'planning',
        planning,
        "import { previewText } from '../../../shared/preview-text'",
      ],
      [
        'internal',
        internal,
        "import { previewText } from '../../../shared/preview-text'",
      ],
    ] as const) {
      expect(source, label).toContain('Residual 995');
      expect(source, label).toContain(importPath);
      expect(source, label).not.toMatch(/function previewText\b/);
      expect(source, label).toContain('previewText(');
    }
  });

  it('automation/planning keep prior maxLength via call-site args', () => {
    expect(automation).toMatch(/previewText\([^)]+,\s*220\)/);
    expect(planning).toMatch(/previewText\([^)]+,\s*200\)/);
  });

  it('collapses whitespace and truncates with ellipsis', () => {
    expect(previewText(undefined)).toBeUndefined();
    expect(previewText(null)).toBeUndefined();
    expect(previewText('')).toBeUndefined();
    expect(previewText('  hello   world  ')).toBe('hello world');
    expect(previewText('abcdefghij', 7)).toBe('abcd...');
    expect(previewText('short', 240)).toBe('short');
  });
});
