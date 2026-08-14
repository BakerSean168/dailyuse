import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { PrismaClient } from '@memoflow/database';
import type { Transactional } from '../adapters/powersync/account-powersync.repository';
import {
  createAccountPrismaRepositories,
  createAccountPrismaModule,
  createAccountPowerSyncRepositories,
  createAccountPowerSyncModule,
  createAccountRuntimeContributions,
  type AccountPrismaRepositorySet,
  type AccountPowerSyncRepositorySet,
  type AccountModuleInstance,
  type CloudAuthLike,
  type IAccountRepository,
  type IAccountClosureOperationRepository,
  type CloudAuthRevocationPort,
  type AccountClosureEventPublisher,
  type OperationAuditRepository,
} from '../../../../src';

/**
 * Account repository seam surface.
 * 账户仓储 seam 的表面契约。
 *
 * The Prisma set returns the full API-lane Port shape (account, closure
 * operation, revocation, event publisher and audit); the PowerSync set
 * returns the desktop lane-capable subset (account only). Convenience module
 * factories keep the api/start/dispose surface, and concrete adapter classes
 * must never leak through the root barrel.
 *
 * Prisma 集合返回完整的 API lane Port 形状（account、closure operation、
 * revocation、event publisher 与 audit）；PowerSync 集合返回桌面 lane 可承载
 * 的子集（仅 account）。便捷模块工厂保留 api/start/dispose 表面，具体适配器类
 * 绝不能通过根 barrel 泄漏。
 *
 * Note: `PrismaAccountClosureOperationRepository` and `AccountClosedWorker`
 * remain in the root barrel until Step E replaces the apps/api consumers with
 * composer injection; they are the documented deferral, not a new leak.
 * 注：`PrismaAccountClosureOperationRepository` 与 `AccountClosedWorker` 在
 * Step E 用 composer 注入替换 apps/api 消费者前仍保留在根 barrel；这是已记录
 * 的延期项，而非新泄漏。
 */
describe('account repository factories surface', () => {
  const fakePrisma = {} as unknown as PrismaClient;
  const fakeElectronDb = {} as unknown as Transactional;

  it('createAccountPrismaRepositories returns the full API-lane Port set', () => {
    const set = createAccountPrismaRepositories({ db: fakePrisma });
    expect(set).toHaveProperty('accountRepository');
    expect(set).toHaveProperty('closureOperationRepository');
    expect(set).toHaveProperty('revocationPort');
    expect(set).toHaveProperty('eventPublisher');
    expect(set).toHaveProperty('auditRepository');
    const typed: AccountPrismaRepositorySet = set;
    expect(typeof typed.revocationPort.revokeAuthentication).toBe('function');
    expect(typeof typed.eventPublisher.publishAccountClosed).toBe('function');
  });

  it('createAccountPowerSyncRepositories returns the desktop lane-capable subset', () => {
    const set = createAccountPowerSyncRepositories(fakeElectronDb);
    expect(set).toHaveProperty('accountRepository');
    expect(set).not.toHaveProperty('closureOperationRepository');
    expect(set).not.toHaveProperty('revocationPort');
    const typed: AccountPowerSyncRepositorySet = set;
    expect(typeof typed.accountRepository.findById).toBe('function');
  });

  it('PowerSync set field names are a lane-capable subset of the Prisma set', () => {
    const prismaKeys = Object.keys(createAccountPrismaRepositories({ db: fakePrisma })).sort();
    const powerSyncKeys = Object.keys(createAccountPowerSyncRepositories(fakeElectronDb)).sort();
    for (const key of powerSyncKeys) {
      expect(prismaKeys).toContain(key);
    }
  });

  it('convenience module factories still expose api/start/dispose', () => {
    const prismaInstance = createAccountPrismaModule(fakePrisma);
    expect(prismaInstance).toHaveProperty('api');
    expect(typeof prismaInstance.start).toBe('function');
    expect(typeof prismaInstance.dispose).toBe('function');
    const typedPrisma: AccountModuleInstance = prismaInstance;
    expect(typeof typedPrisma.api.listAccounts).toBe('function');

    const powerSyncInstance = createAccountPowerSyncModule(fakeElectronDb);
    expect(powerSyncInstance).toHaveProperty('api');
    expect(typeof powerSyncInstance.start).toBe('function');
    expect(typeof powerSyncInstance.dispose).toBe('function');
    const typedPowerSync: AccountModuleInstance = powerSyncInstance;
    expect(typeof typedPowerSync.api.listAccounts).toBe('function');
  });

  it('createAccountRuntimeContributions accepts a repository and optional contributions', () => {
    const runtime = createAccountRuntimeContributions(
      createAccountPowerSyncRepositories(fakeElectronDb).accountRepository,
    );
    expect(Array.isArray(runtime)).toBe(true);
  });

  it('does not leak newly-added concrete adapter classes through the root barrel', async () => {
    const forbidden = [
      'PrismaAccountRepository',
      'PowerSyncAccountRepository',
      'AccountClosureOutboxEventPublisher',
      'PrismaCloudAuthRevocationAdapter',
      'MemoryAccountRepository',
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

  it('root barrel type-exports every set field type (compile-time lock)', () => {
    const account = (_t: IAccountRepository) => undefined;
    const closure = (_t: IAccountClosureOperationRepository) => undefined;
    const revocation = (_t: CloudAuthRevocationPort) => undefined;
    const publisher = (_t: AccountClosureEventPublisher) => undefined;
    const audit = (_t: OperationAuditRepository) => undefined;
    const cloudAuth = (_t: CloudAuthLike) => undefined;

    expect(typeof account).toBe('function');
    expect(typeof closure).toBe('function');
    expect(typeof revocation).toBe('function');
    expect(typeof publisher).toBe('function');
    expect(typeof audit).toBe('function');
    expect(typeof cloudAuth).toBe('function');
  });
});
