import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1063: dead useResultHandler dual removed.
 * packages/app-vue/src/shared/utils/result-helpers.ts had no consumers;
 * composable error duals retire onto createComposableHandleError sole (973/975/1055/1057/1059).
 * Soft residual: usePassword / account checkAvailability toast-only keep-boundary remains.
 * Does not flip §13.2 checkboxes.
 */
describe('result-helpers dead dual removed (residual 1063)', () => {
  const utilsDir = __dirname;
  const deadPath = resolve(utilsDir, 'result-helpers.ts');
  const sole = readFileSync(resolve(utilsDir, 'create-composable-handle-error.ts'), 'utf8');

  it('removes result-helpers.ts dead dual file', () => {
    expect(existsSync(deadPath)).toBe(false);
  });

  it('keeps createComposableHandleError as composable error sole', () => {
    expect(sole).toMatch(/export function createComposableHandleError\b/);
    expect(sole).toContain('Residual 1059');
    expect(sole).toContain('translateResultError');
  });

  it('shared utils barrel / nearby files do not reintroduce useResultHandler', () => {
    const handleErrorSurface = readFileSync(
      resolve(utilsDir, 'create-composable-handle-error-dual.surface.spec.ts'),
      'utf8',
    );
    expect(handleErrorSurface).not.toContain('useResultHandler');
    expect(handleErrorSurface).not.toContain('result-helpers');
  });

  it('documents residual 1063 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(utilsDir, 'result-helpers-dead.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1063');
    expect(self).toContain('Does not flip §13.2 checkboxes');
  });
});
