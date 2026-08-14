import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { PrismaClient } from '@memoflow/database';
import type { IElectronDatabase } from '@memoflow/contracts/electron';
import {
  createSchedulePrismaRepositories,
  createSchedulePowerSyncRepositories,
  createSchedulePrismaModule,
  createSchedulePowerSyncModule,
  createScheduleRuntimeContribution,
  type ScheduleRepositorySet,
  type SchedulePowerSyncRepositories,
  type ScheduleModuleInstance,
  type IScheduleRepository,
  type IScheduleExecutionRepository,
  type IScheduleTaskRepository,
  type ScheduleTaskSourceExecutor,
} from '../../../../src';

/**
 * Schedule repository seam surface.
 * 调度仓储 seam 的表面契约。
 *
 * Both lane factories return the three schedule repositories and the lease
 * coordinator (Prisma adds the optional audit repository, PowerSync adds the
 * lease repository). The runtime contribution accepts the source executor and
 * optional `shouldScheduleTask` predicate, convenience module factories keep
 * the api/start/dispose surface, and no concrete adapter class leaks through
 * the root barrel.
 *
 * 两个 lane 工厂都返回三个调度仓储与 lease coordinator（Prisma 额外提供可选审计
 * 仓储，PowerSync 额外提供 lease repository）。运行时贡献接受 source executor 与
 * 可选 `shouldScheduleTask` 谓词，便捷模块工厂保留 api/start/dispose 表面，具体
 * 适配器类绝不通过根 barrel 泄漏。
 */
describe('schedule repository factories surface', () => {
  const fakePrisma = {} as unknown as PrismaClient;
  const fakeElectronDb = {} as unknown as IElectronDatabase;

  const sharedNames = [
    'scheduleRepository',
    'scheduleExecutionRepository',
    'scheduleTaskRepository',
    'leaseCoordinator',
  ];

  it('createSchedulePrismaRepositories returns the lane-capable Prisma Port set', () => {
    const set = createSchedulePrismaRepositories(fakePrisma);
    for (const name of sharedNames) {
      expect(set).toHaveProperty(name);
    }
    expect(set).toHaveProperty('auditRepository');
    const typed: ScheduleRepositorySet = set;
    expect(typeof typed.leaseCoordinator.acquire).toBe('function');
  });

  it('createSchedulePowerSyncRepositories returns the PowerSync set with lease ingredients', () => {
    const set = createSchedulePowerSyncRepositories(fakeElectronDb);
    for (const name of sharedNames) {
      expect(set).toHaveProperty(name);
    }
    expect(set).toHaveProperty('leaseRepository');
    const typed: SchedulePowerSyncRepositories = set;
    expect(typeof typed.leaseRepository.tryAcquire).toBe('function');
  });

  it('Prisma and PowerSync sets agree on all shared lane-capable field names', () => {
    const prismaKeys = Object.keys(createSchedulePrismaRepositories(fakePrisma));
    const powerSyncKeys = Object.keys(createSchedulePowerSyncRepositories(fakeElectronDb));
    for (const name of sharedNames) {
      expect(prismaKeys).toContain(name);
      expect(powerSyncKeys).toContain(name);
    }
  });

  it('convenience module factories preserve api/start/dispose', () => {
    const prismaInstance = createSchedulePrismaModule(fakePrisma);
    expect(prismaInstance).toHaveProperty('api');
    expect(typeof prismaInstance.start).toBe('function');
    expect(typeof prismaInstance.dispose).toBe('function');
    const typedPrisma: ScheduleModuleInstance = prismaInstance;
    expect(typeof typedPrisma.api.listTasks).toBe('function');

    const powerSyncInstance = createSchedulePowerSyncModule(fakeElectronDb);
    expect(powerSyncInstance).toHaveProperty('api');
    expect(typeof powerSyncInstance.start).toBe('function');
    expect(typeof powerSyncInstance.dispose).toBe('function');
    const typedPowerSync: ScheduleModuleInstance = powerSyncInstance;
    expect(typeof typedPowerSync.api.listTasks).toBe('function');
  });

  it('createScheduleRuntimeContribution accepts sourceExecutor and shouldScheduleTask', () => {
    const set = createSchedulePowerSyncRepositories(fakeElectronDb);
    const sourceExecutor: ScheduleTaskSourceExecutor = {
      execute: async () => ({ nextRunAt: null }),
    };
    const runtime = createScheduleRuntimeContribution({
      scheduleTaskRepository: set.scheduleTaskRepository,
      sourceExecutor,
      shouldScheduleTask: async () => true,
    });
    expect(typeof runtime.start).toBe('function');
    expect(typeof runtime.stop).toBe('function');
  });

  it('does not leak concrete adapter classes through the root barrel', async () => {
    const forbidden = [
      'SchedulePrismaRepository',
      'ScheduleTaskPrismaRepository',
      'ScheduleExecutionPrismaRepository',
      'PowerSyncScheduleRepository',
      'PowerSyncScheduleTaskRepository',
      'PowerSyncScheduleExecutionRepository',
      'ScheduleEventDeliveryLogConsumer',
      'ScheduleLeaseCoordinator',
    ];

    const root = readFileSync(resolve(__dirname, '../../../index.ts'), 'utf8');
    for (const name of forbidden) {
      expect(root).not.toMatch(new RegExp(`\\b${name}\\b`));
    }

    const infra = readFileSync(resolve(__dirname, '../index.ts'), 'utf8');
    for (const name of forbidden) {
      expect(infra).not.toMatch(new RegExp(`\\b${name}\\b`));
    }

    const rootModule = await import('../../../../src');
    const exportedNames = Object.keys(rootModule).sort();
    for (const name of forbidden) {
      expect(exportedNames).not.toContain(name);
    }
  });

  it('root barrel type-exports every shared set field type (compile-time lock)', () => {
    const schedule = (_t: IScheduleRepository) => undefined;
    const execution = (_t: IScheduleExecutionRepository) => undefined;
    const task = (_t: IScheduleTaskRepository) => undefined;

    expect(typeof schedule).toBe('function');
    expect(typeof execution).toBe('function');
    expect(typeof task).toBe('function');
  });
});
