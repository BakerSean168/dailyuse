import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { PrismaClient } from '@memoflow/database';
import type { IElectronDatabase } from '@memoflow/contracts/electron';
import {
  createGovernancePrismaRepositories,
  createGovernancePowerSyncRepositories,
  type GovernanceRepositorySet,
  type GovernanceModuleInstance,
} from '../../../../src';
import { createGovernancePrismaModule } from '../prisma';
import { createGovernancePowerSyncModule } from '../powersync';

/**
 * Governance repository seam surface.
 * 治理仓储 seam 的表面契约。
 *
 * The two host-facing repository factories must return the same Port shape,
 * the convenience module factories must keep the api/start/dispose surface,
 * and concrete adapter classes must never leak through the root barrel.
 *
 * 两个宿主向仓储工厂必须返回相同的 Port 形状，
 * 便捷模块工厂必须保留 api/start/dispose 表面，
 * 具体适配器类绝不能通过根 barrel 泄漏。
 */
describe('governance repository factories surface', () => {
  const fakePrisma = {} as unknown as PrismaClient;
  const fakeElectronDb = {} as unknown as IElectronDatabase;

  it('createGovernancePrismaRepositories returns the repository Port fields', () => {
    const set = createGovernancePrismaRepositories(fakePrisma);
    expect(set).toHaveProperty('ruleRepository');
    expect(set).toHaveProperty('revisionRepository');
    const typed: GovernanceRepositorySet = set;
    expect(typeof typed.ruleRepository.save).toBe('function');
    expect(typeof typed.revisionRepository.findByRuleId).toBe('function');
  });

  it('createGovernancePowerSyncRepositories returns the same Port shape', () => {
    const set = createGovernancePowerSyncRepositories(fakeElectronDb);
    expect(set).toHaveProperty('ruleRepository');
    expect(set).toHaveProperty('revisionRepository');
    expect(Object.keys(set).sort()).toEqual(
      Object.keys(createGovernancePrismaRepositories(fakePrisma)).sort(),
    );
    const typed: GovernanceRepositorySet = set;
    expect(typeof typed.ruleRepository.save).toBe('function');
    expect(typeof typed.revisionRepository.findByRuleId).toBe('function');
  });

  it('convenience module factories still expose api/start/dispose', () => {
    const prismaInstance = createGovernancePrismaModule(fakePrisma);
    expect(prismaInstance).toHaveProperty('api');
    expect(typeof prismaInstance.start).toBe('function');
    expect(typeof prismaInstance.dispose).toBe('function');
    const typed: GovernanceModuleInstance = prismaInstance;
    expect(typeof typed.api.createRule).toBe('function');

    const powerSyncInstance = createGovernancePowerSyncModule(fakeElectronDb);
    expect(powerSyncInstance).toHaveProperty('api');
    expect(typeof powerSyncInstance.start).toBe('function');
    expect(typeof powerSyncInstance.dispose).toBe('function');
  });

  it('does not leak concrete adapter classes through the root barrel', () => {
    const root = readFileSync(resolve(__dirname, '../../../index.ts'), 'utf8');
    for (const name of [
      'RulePrismaRepository',
      'RuleRevisionPrismaRepository',
      'PowerSyncRuleRepository',
      'PowerSyncRuleRevisionRepository',
    ]) {
      expect(root).not.toMatch(new RegExp(`\\b${name}\\b`));
    }
  });
});
