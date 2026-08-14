import { describe, expect, it } from 'vitest';
import type { PrismaClient } from '@memoflow/database';
import type { IElectronDatabase } from '@memoflow/contracts/electron';
import { createAIModule } from '../ai.module';
import { createAIPrismaRepositories } from '../prisma';
import { createAIPowerSyncRepositories } from '../powersync';

/**
 * createAIModule checkpoint pair invariant.
 * createAIModule checkpoint pair 的 all-or-none invariant。
 *
 * The two internal checkpoint ports must be supplied together or not at all.
 * A half-wired pair fails closed at module construction; Desktop supplies
 * neither, so `api.checkpoints` stays `undefined` there, while the Prisma lane
 * supplies both and gets the nested checkpoint surface.
 *
 * 两个内部 checkpoint port 必须同时提供或同时缺省。半套 pair 在模块构造时
 * fail closed；Desktop 两者都不提供，因此 `api.checkpoints` 保持 `undefined`，
 * 而 Prisma lane 提供完整 pair 并取得嵌套 checkpoint surface。
 */
describe('createAIModule checkpoint pair invariant', () => {
  const fakePrisma = {} as unknown as PrismaClient;
  const fakeElectronDb = {} as unknown as IElectronDatabase;

  it('accepts a full Prisma set and exposes the nested checkpoint surface', () => {
    const repositories = createAIPrismaRepositories(fakePrisma);
    const instance = createAIModule({
      conversationRepository: repositories.conversationRepository,
      providerConfigRepository: repositories.providerConfigRepository,
      knowledgeIndexRepository: repositories.knowledgeIndexRepository,
      executionLogPort: repositories.executionLogPort,
      agentCheckpointPort: repositories.agentCheckpointPort,
      langGraphCheckpointPort: repositories.langGraphCheckpointPort,
    });

    expect(instance.api.checkpoints?.agent).toBe(repositories.agentCheckpointPort);
    expect(instance.api.checkpoints?.langGraph).toBe(repositories.langGraphCheckpointPort);
  });

  it('fails closed when only agentCheckpointPort is supplied', () => {
    const repositories = createAIPrismaRepositories(fakePrisma);
    expect(() =>
      createAIModule({
        conversationRepository: repositories.conversationRepository,
        providerConfigRepository: repositories.providerConfigRepository,
        agentCheckpointPort: repositories.agentCheckpointPort,
      }),
    ).toThrow(/all-or-none/);
  });

  it('fails closed when only langGraphCheckpointPort is supplied', () => {
    const repositories = createAIPrismaRepositories(fakePrisma);
    expect(() =>
      createAIModule({
        conversationRepository: repositories.conversationRepository,
        providerConfigRepository: repositories.providerConfigRepository,
        langGraphCheckpointPort: repositories.langGraphCheckpointPort,
      }),
    ).toThrow(/all-or-none/);
  });

  it('accepts a PowerSync set with no checkpoint ports and keeps the surface undefined', () => {
    const repositories = createAIPowerSyncRepositories(fakeElectronDb);
    const instance = createAIModule({
      conversationRepository: repositories.conversationRepository,
      providerConfigRepository: repositories.providerConfigRepository,
      knowledgeIndexRepository: repositories.knowledgeIndexRepository,
      executionLogPort: repositories.executionLogPort,
    });

    expect(instance.api.checkpoints).toBeUndefined();
  });
});
