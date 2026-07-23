import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1071: dead useViewportBreakpoint composable removed.
 * packages/app-vue/src/shared/composables/useViewportBreakpoint.ts had no runtime
 * consumers (only self-reference); settings/AI views use local viewport logic
 * instead of this planned UI redesign helper.
 * Soft residual: usePassword / account checkAvailability toast-only keep-boundary remains.
 * Soft residual 1065: goalOperations createGoalErrorHandler keep-boundary remains.
 * Does not flip §13.2 checkboxes.
 */
describe('useViewportBreakpoint dead composable removed (residual 1071)', () => {
  const composablesDir = __dirname;
  const deadPath = resolve(composablesDir, 'useViewportBreakpoint.ts');

  it('removes useViewportBreakpoint.ts dead composable file', () => {
    expect(existsSync(deadPath)).toBe(false);
  });

  it('shared composables directory does not reintroduce the dead helper', () => {
    const sibling = readFileSync(
      resolve(composablesDir, 'useDesktopWindowControls.ts'),
      'utf8',
    );
    expect(sibling).not.toContain('useViewportBreakpoint');
    expect(sibling).not.toContain('VIEWPORT_BREAKPOINTS');
  });

  it('documents residual 1071 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(composablesDir, 'use-viewport-breakpoint-dead.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1071');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('dead');
  });
});
