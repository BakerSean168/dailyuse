import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TaskPriority, mapImportanceToTaskPriority } from './task-priority';

/**
 * Residual 1168: mapPriority dual retired (contracts schedule sole).
 * Sole: mapImportanceToTaskPriority(importance) → TaskPriority.
 * Goal + Task schedule-projection-source import sole; local dual bodies deleted.
 * Soft residual 1168: buildTaskName / trigger scheduling stay domain-specific (no force-merge).
 * Soft residual 1165: startOfDay keep-boundary remains separate.
 * Does not flip §13.2 checkboxes.
 */
describe('mapImportanceToTaskPriority dual retired (residual 1168)', () => {
  const dir = __dirname;
  const sole = readFileSync(resolve(dir, 'task-priority.ts'), 'utf8');
  const voIndex = readFileSync(resolve(dir, 'index.ts'), 'utf8');
  const goal = readFileSync(
    resolve(dir, '../../../../../goal/src/server/infrastructure/schedule-projection-source.ts'),
    'utf8',
  );
  const task = readFileSync(
    resolve(dir, '../../../../../task/src/server/infrastructure/schedule-projection-source.ts'),
    'utf8',
  );

  it('owns sole mapImportanceToTaskPriority helper body', () => {
    expect(sole).toContain('Residual 1168');
    expect(sole).toMatch(/export function mapImportanceToTaskPriority\b/);
    expect(sole).toContain("importance === 'Vital'");
    expect(sole).toContain('TaskPriority.Urgent');
    expect(sole).toContain('TaskPriority.High');
    expect(sole).toContain('TaskPriority.Normal');
    expect(voIndex).toContain('mapImportanceToTaskPriority');
  });

  it('retires Goal/Task dual mapPriority bodies onto sole import', () => {
    for (const [label, source] of [
      ['goal', goal],
      ['task', task],
    ] as const) {
      expect(source, label).toContain('mapImportanceToTaskPriority');
      expect(source, label).toContain("from '@dailyuse/contracts/schedule'");
      expect(source, label).not.toMatch(/function mapPriority\b/);
      expect(source, label).toContain('Soft residual 1168');
    }
    expect(goal).toContain('mapImportanceToTaskPriority(goalDTO.importance)');
    expect(task).toContain('mapImportanceToTaskPriority(templateDTO.importance)');
  });

  it('runtime: maps importance strings to TaskPriority', () => {
    expect(mapImportanceToTaskPriority('Vital')).toBe(TaskPriority.Urgent);
    expect(mapImportanceToTaskPriority('Important')).toBe(TaskPriority.High);
    expect(mapImportanceToTaskPriority('Normal')).toBe(TaskPriority.Normal);
    expect(mapImportanceToTaskPriority('Low')).toBe(TaskPriority.Normal);
    expect(mapImportanceToTaskPriority('')).toBe(TaskPriority.Normal);
  });

  it('documents residual 1168 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'map-importance-to-task-priority-dual.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1168');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('dual retired');
  });
});
