import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1043: goal/schedule/reminder/task integration-helpers duals retired
 * onto test-utils setup sole (getPrisma/disconnectPrisma/cleanAll/seedAccount).
 * Soft residual: task keeps local cleanTaskTables/seedFolder/seedTemplateRaw/seedInstanceRaw.
 * Soft residual 1044: tip focused suite numbers track Residual 1044 evidence tip (312/1351).
 * Does not flip §13.2 checkboxes.
 */
describe('integration-helpers dual retired (residual 1043)', () => {
  const sole = readFileSync(
    resolve(__dirname, '../../../test-utils/src/setup/integration-helpers.ts'),
    'utf8',
  );
  const packages = ['goal', 'schedule', 'reminder', 'task'] as const;

  it('owns sole getPrisma/disconnectPrisma/cleanAll/seedAccount bodies', () => {
    expect(sole).toContain('Residual 1043');
    expect(sole).toMatch(/export async function getPrisma\b/);
    expect(sole).toMatch(/export async function disconnectPrisma\b/);
    expect(sole).toMatch(/export async function cleanAll\b/);
    expect(sole).toMatch(/export async function seedAccount\b/);
    expect(sole).toContain('cleanAllTables');
    expect(sole).toContain("from '@dailyuse/database'");
    expect(sole).toContain('emailPrefix');
  });

  it('package shims re-export sole without local dual bodies for shared helpers', () => {
    for (const pkg of packages) {
      const source = readFileSync(
        resolve(__dirname, `../../../${pkg}/src/__tests__/integration-helpers.ts`),
        'utf8',
      );
      expect(source, pkg).toContain('Residual 1043');
      expect(source, pkg).toContain(
        "from '../../../test-utils/src/setup/integration-helpers'",
      );
      expect(source, pkg).toContain('getPrisma');
      expect(source, pkg).toContain('disconnectPrisma');
      expect(source, pkg).toContain('cleanAll');
      expect(source, pkg).toContain('seedAccount');
      expect(source, pkg).not.toMatch(/export async function getPrisma\b/);
      expect(source, pkg).not.toMatch(/export async function disconnectPrisma\b/);
      expect(source, pkg).not.toMatch(/export async function cleanAll\b/);
      expect(source, pkg).not.toMatch(/export async function seedAccount\b/);
      expect(source, pkg).not.toContain('cleanAllTables');
    }
  });

  it('task keep-boundary retains task-only seed/cleanup helpers', () => {
    const task = readFileSync(
      resolve(__dirname, '../../../task/src/__tests__/integration-helpers.ts'),
      'utf8',
    );
    expect(task).toMatch(/export async function cleanTaskTables\b/);
    expect(task).toMatch(/export async function seedFolder\b/);
    expect(task).toMatch(/export async function seedTemplateRaw\b/);
    expect(task).toMatch(/export async function seedInstanceRaw\b/);
    expect(task).toContain('TaskFolderId');
  });

  it('goal/schedule/reminder shims stay re-export-only (no task-only helpers)', () => {
    for (const pkg of ['goal', 'schedule', 'reminder'] as const) {
      const source = readFileSync(
        resolve(__dirname, `../../../${pkg}/src/__tests__/integration-helpers.ts`),
        'utf8',
      );
      expect(source, pkg).not.toContain('cleanTaskTables');
      expect(source, pkg).not.toContain('seedFolder');
      expect(source, pkg).not.toContain('seedTemplateRaw');
      expect(source, pkg).not.toContain('seedInstanceRaw');
      expect(source, pkg).not.toMatch(/let prismaPromise/);
    }
  });
});
