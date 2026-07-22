import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 247: task component types do not dual-alias DAG types as *ViewModel.
 * Canonical DAG types live in @dailyuse/task/client (and modules/task/types).
 */
describe('task component DAG type single-track surface', () => {
  const source = readFileSync(resolve(__dirname, 'types.ts'), 'utf8');

  it('does not dual-alias TaskForDAG/TaskGraph* as ViewModel', () => {
    expect(source).not.toContain('TaskForDAGViewModel');
    expect(source).not.toContain('TaskGraphEdgeViewModel');
    expect(source).not.toContain('TaskGraphDataViewModel');
    expect(source).not.toMatch(/export type \w+ViewModel = TaskForDAG/);
    expect(source).not.toMatch(/export type \w+ViewModel = TaskGraph/);
    expect(source).not.toContain("from '@dailyuse/task/client'");
  });
});
