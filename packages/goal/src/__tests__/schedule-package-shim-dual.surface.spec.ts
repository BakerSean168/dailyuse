import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ScheduleTask } from '@dailyuse/test-utils';

/**
 * Residual 1035: goal/task/reminder schedule-package-shim duals retired onto test-utils sole.
 * Soft residual 1038: tip focused suite numbers track Residual 1038 evidence tip (309/1339).
 * Does not flip §13.2 checkboxes.
 */
describe('schedule-package-shim dual retired (residual 1035)', () => {
  const sole = readFileSync(
    resolve(__dirname, '../../../test-utils/src/shims/schedule-package-shim.ts'),
    'utf8',
  );
  const goalShim = readFileSync(resolve(__dirname, 'schedule-package-shim.ts'), 'utf8');
  const taskShim = readFileSync(
    resolve(__dirname, '../../../task/src/__tests__/schedule-package-shim.ts'),
    'utf8',
  );
  const reminderShim = readFileSync(
    resolve(__dirname, '../../../reminder/src/__tests__/schedule-package-shim.ts'),
    'utf8',
  );
  const goalVitest = readFileSync(resolve(__dirname, '../../vitest.config.ts'), 'utf8');
  const taskVitest = readFileSync(resolve(__dirname, '../../../task/vitest.config.ts'), 'utf8');
  const reminderVitest = readFileSync(
    resolve(__dirname, '../../../reminder/vitest.config.ts'),
    'utf8',
  );

  it('owns sole ScheduleTask shim body', () => {
    expect(sole).toContain('Residual 1035');
    expect(sole).toMatch(/export class ScheduleTask\b/);
    expect(sole).toContain('static create');
    expect(sole).toContain('createMetadata');
    expect(sole).toContain('toDTO()');
  });

  it('goal/task/reminder shims re-export sole without local dual bodies', () => {
    for (const [label, source] of [
      ['goal', goalShim],
      ['task', taskShim],
      ['reminder', reminderShim],
    ] as const) {
      expect(source, label).toContain('Residual 1035');
      expect(source, label).toContain("from '@dailyuse/test-utils'");
      expect(source, label).toContain('ScheduleTask');
      expect(source, label).not.toMatch(/export class ScheduleTask\b/);
      expect(source, label).not.toMatch(/function createMetadata\b/);
    }
  });

  it('vitest configs alias @dailyuse/schedule to test-utils sole', () => {
    for (const [label, source] of [
      ['goal', goalVitest],
      ['task', taskVitest],
      ['reminder', reminderVitest],
    ] as const) {
      expect(source, label).toContain('Residual 1035');
      expect(source, label).toContain('../test-utils/src/shims/schedule-package-shim.ts');
      expect(source, label).not.toContain("src/__tests__/schedule-package-shim.ts");
    }
  });

  it('creates schedule tasks with metadata toDTO bridge', () => {
    const task = ScheduleTask.create({
      identityId: 'IdentityId_1',
      name: 'n',
      sourceModule: 'task',
      sourceEntityId: 'entity-1',
      schedule: { kind: 'once' } as never,
      metadata: { payload: { templateId: 't1' } } as never,
    });
    expect(task.id).toBe('ScheduleTaskId_entity-1');
    expect(task.name).toBe('n');
    expect(task.metadata.toDTO()).toEqual({ payload: { templateId: 't1' } });
  });
});
