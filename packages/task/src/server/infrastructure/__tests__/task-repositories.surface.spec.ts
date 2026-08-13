import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { PrismaClient } from '@memoflow/database';
import type { IElectronDatabase } from '@memoflow/contracts/electron';
import {
  createTaskPrismaRepositories,
  createTaskPowerSyncRepositories,
  type TaskRepositorySet,
  type TaskModuleInstance,
} from '../../../../src';
import { createTaskPrismaModule } from '../prisma';
import { createTaskPowerSyncModule } from '../powersync';

/**
 * Task repository seam surface.
 * 任务仓储 seam 的表面契约。
 *
 * The two host-facing repository factories must return the same port-shaped
 * dependency names, the transaction runner must be present on both variants,
 * convenience module factories keep the api/start/dispose surface, and concrete
 * adapter classes must never leak through the root barrel.
 *
 * 两个宿主向仓储工厂必须返回相同的 Port 形状依赖名，两种变体都必须包含
 * 事务运行器，便捷模块工厂保留 api/start/dispose 表面，具体适配器类绝不能
 * 通过根 barrel 泄漏。
 */
describe('task repository factories surface', () => {
  const fakePrisma = {} as unknown as PrismaClient;
  const fakeElectronDb = {} as unknown as IElectronDatabase;

  it('createTaskPrismaRepositories returns the full repository Port set', () => {
    const set = createTaskPrismaRepositories(fakePrisma);
    expect(set).toHaveProperty('taskTemplateRepository');
    expect(set).toHaveProperty('taskInstanceRepository');
    expect(set).toHaveProperty('taskDependencyRepository');
    expect(set).toHaveProperty('taskFolderRepository');
    expect(set).toHaveProperty('taskWriteTransactionRunner');
    const typed: TaskRepositorySet = set;
    expect(typeof typed.taskWriteTransactionRunner.run).toBe('function');
  });

  it('createTaskPowerSyncRepositories returns the same Port shape', () => {
    const set = createTaskPowerSyncRepositories(fakeElectronDb);
    expect(set).toHaveProperty('taskTemplateRepository');
    expect(set).toHaveProperty('taskInstanceRepository');
    expect(set).toHaveProperty('taskDependencyRepository');
    expect(set).toHaveProperty('taskFolderRepository');
    expect(set).toHaveProperty('taskWriteTransactionRunner');
    expect(Object.keys(set).sort()).toEqual(
      Object.keys(createTaskPrismaRepositories(fakePrisma)).sort(),
    );
    const typed: TaskRepositorySet = set;
    expect(typeof typed.taskWriteTransactionRunner.run).toBe('function');
  });

  it('convenience module factories still expose api/start/dispose', () => {
    const prismaInstance = createTaskPrismaModule(fakePrisma);
    expect(prismaInstance).toHaveProperty('api');
    expect(typeof prismaInstance.start).toBe('function');
    expect(typeof prismaInstance.dispose).toBe('function');
    const typed: TaskModuleInstance = prismaInstance;
    expect(typeof typed.api.createTaskTemplate).toBe('function');

    const powerSyncInstance = createTaskPowerSyncModule(fakeElectronDb);
    expect(powerSyncInstance).toHaveProperty('api');
    expect(typeof powerSyncInstance.start).toBe('function');
    expect(typeof powerSyncInstance.dispose).toBe('function');
  });

  it('does not leak concrete adapter classes through the root barrel', async () => {
    const forbidden = [
      'TaskTemplatePrismaRepository',
      'TaskInstancePrismaRepository',
      'TaskDependencyPrismaRepository',
      'TaskFolderPrismaRepository',
      'PrismaTaskWriteTransactionRunner',
      'PrismaTaskGoalOutboxDispatchStore',
      'PowerSyncTaskTemplateRepository',
      'PowerSyncTaskInstanceRepository',
      'PowerSyncTaskDependencyRepository',
      'PowerSyncTaskFolderRepository',
      'PowerSyncTaskWriteTransactionRunner',
      'PowerSyncTaskGoalOutboxDispatchStore',
    ];

    const root = readFileSync(resolve(__dirname, '../../../index.ts'), 'utf8');
    for (const name of forbidden) {
      expect(root).not.toMatch(new RegExp(`\\b${name}\\b`));
    }

    const rootModule = await import('../../../../src');
    const exportedNames = Object.keys(rootModule).sort();
    for (const name of forbidden) {
      expect(exportedNames).not.toContain(name);
    }
  });
});
