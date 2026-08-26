import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1065: goalOperations createGoalErrorHandler keep-boundary.
 * Rich structured console logging (scope + ResultError details/context) and
 * executeGoalOperation orchestration with optional onError hook intentionally
 * differ from createComposableHandleError (message + setError + simple report).
 * Soft residual: usePassword / account checkAvailability toast-only keep-boundary.
 * Soft residual: schedule route parsers / goal parseNumber keep-boundaries elsewhere.
 * Does not flip §13.2 checkboxes.
 */
describe('goalOperations createGoalErrorHandler keep-boundary (residual 1065)', () => {
  const composablesDir = __dirname;
  const goalOps = readFileSync(resolve(composablesDir, 'goalOperations.ts'), 'utf8');
  const handleErrorSole = readFileSync(
    resolve(composablesDir, '../../../shared/utils/create-composable-handle-error.ts'),
    'utf8',
  );
  const consumers = {
    useGoal: readFileSync(resolve(composablesDir, 'useGoal.ts'), 'utf8'),
    useKeyResults: readFileSync(resolve(composablesDir, 'useKeyResults.ts'), 'utf8'),
    useGoalRecords: readFileSync(resolve(composablesDir, 'useGoalRecords.ts'), 'utf8'),
  } as const;

  it('owns createGoalErrorHandler rich-log body with Residual 1065 keep-boundary marker', () => {
    expect(goalOps).toContain('Residual 1065 keep-boundary');
    expect(goalOps).toMatch(/export function createGoalErrorHandler\b/);
    expect(goalOps).toMatch(/export async function executeGoalOperation\b/);
    expect(goalOps).toMatch(/export async function executeGoalAction\b/);
    expect(goalOps).toContain('translateResultError');
    expect(goalOps).toContain("`[goal] ${scope ?? 'error'}`");
    expect(goalOps).toContain('details');
    expect(goalOps).toContain('context');
    expect(goalOps).toContain('translatedMessage');
    // Comment may name the sole for keep-boundary docs; no import/re-export/wrap
    expect(goalOps).not.toMatch(/from ['"].*create-composable-handle-error['"]/);
    expect(goalOps).not.toMatch(/export \{[^}]*createComposableHandleError/);
    expect(goalOps).not.toMatch(/createComposableHandleError\s*\(/);
  });

  it('differs from createComposableHandleError sole shape (no force-merge)', () => {
    expect(handleErrorSole).toMatch(/export function createComposableHandleError\b/);
    expect(handleErrorSole).toContain('Soft residual 1065');
    // Soft residual may name the keep-boundary; body must not implement goal rich-log
    expect(handleErrorSole).not.toMatch(/export function createGoalErrorHandler\b/);
    expect(handleErrorSole).not.toContain('[goal]');
    expect(handleErrorSole).not.toContain('translatedMessage');
    // Sole reports a translated message only (no scope-bearing ErrorHandler signature)
    expect(goalOps).toContain('scope?: string');
    expect(handleErrorSole).not.toMatch(/scope\?: string/);
    // Sole has simple report hook; goal ops has structured console.error object
    expect(handleErrorSole).toContain('report?: (message: string) => void');
    expect(goalOps).toContain('onError?: ErrorHandler');
  });

  it('goal composable consumers use createGoalErrorHandler, not handleError sole', () => {
    for (const [label, source] of Object.entries(consumers)) {
      expect(source, label).toContain("from './goalOperations'");
      expect(source, label).toContain('createGoalErrorHandler');
      expect(source, label).not.toContain('createComposableHandleError');
      expect(source, label).not.toContain('create-composable-handle-error');
    }
  });

  it('documents residual 1065 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(composablesDir, 'goal-operations-keep-boundary.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1065');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
