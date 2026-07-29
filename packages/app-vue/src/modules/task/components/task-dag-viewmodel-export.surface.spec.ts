import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 247/487: task DAG types are single-track.
 * Canonical names: TaskForDAG / TaskGraphData / TaskGraphEdge
 * (modules/task/types/task-dag.types + @memoflow/task/client).
 * No dual-alias *ViewModel names in components/types or consumers.
 */
describe('task component DAG type single-track surface (residual 247/487)', () => {
  const componentsDir = resolve(__dirname);
  const moduleDir = resolve(__dirname, '..');
  const typesSource = readFileSync(resolve(componentsDir, 'types.ts'), 'utf8');

  function walk(dir: string): string[] {
    const out: string[] = [];
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) {
        if (name === 'node_modules' || name === 'dist') continue;
        out.push(...walk(full));
      } else if (/\.(ts|vue)$/.test(name) && !name.endsWith('.spec.ts')) {
        out.push(full);
      }
    }
    return out;
  }

  it('does not dual-alias TaskForDAG/TaskGraph* as ViewModel in components/types', () => {
    expect(typesSource).not.toContain('TaskForDAGViewModel');
    expect(typesSource).not.toContain('TaskGraphEdgeViewModel');
    expect(typesSource).not.toContain('TaskGraphDataViewModel');
    expect(typesSource).not.toMatch(/export type \w+ViewModel = TaskForDAG/);
    expect(typesSource).not.toMatch(/export type \w+ViewModel = TaskGraph/);
    expect(typesSource).not.toContain("from '@memoflow/task/client'");
  });

  it('consumers use canonical TaskForDAG/TaskGraph* names (residual 487)', () => {
    const banned = ['TaskForDAGViewModel', 'TaskGraphEdgeViewModel', 'TaskGraphDataViewModel'];
    const files = walk(moduleDir);
    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      for (const name of banned) {
        if (src.includes(name)) offenders.push(`${file}: ${name}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('DAG visualization imports canonical types from task-dag.types', () => {
    const dag = readFileSync(resolve(componentsDir, 'dag/TaskDAGVisualization.vue'), 'utf8');
    expect(dag).toContain('TaskForDAG');
    expect(dag).toContain('TaskGraphData');
    expect(dag).toContain('task-dag.types');
    expect(dag).not.toContain('TaskForDAGViewModel');
  });
});
