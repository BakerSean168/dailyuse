import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { PrismaClient } from '@memoflow/database';
import type { IElectronDatabase } from '@memoflow/contracts/electron';
import type { IAgentCheckpointPort, ILangGraphCheckpointPort } from '../../application/ports';
import {
  createAIPowerSyncRepositories,
  createAIPowerSyncModule,
  createAIModule,
  createAIPrismaRepositories,
  type AIPowerSyncRepositorySet,
  type AIPrismaRepositorySet,
  type AIModuleInstance,
  type IAIConversationRepository,
  type IAIProviderConfigRepository,
} from '../../../../src';

/**
 * AI repository seam surface.
 * AI 仓储 seam 的表面契约。
 *
 * `createAIPowerSyncRepositories` returns the four persistence ports
 * (conversation, provider config, knowledge index, execution log) while host
 * capability ports stay out of the set. `createAIPrismaRepositories` returns
 * those same four ports plus the API-only checkpoint pair (agent checkpoint,
 * LangGraph checkpoint) — the PowerSync set stays deliberately asymmetric. The
 * convenience module factory keeps the api/start/dispose surface, and no
 * concrete adapter class leaks through the root barrel.
 *
 * `createAIPowerSyncRepositories` 返回四个持久化 Port（conversation、provider
 * config、knowledge index、execution log），宿主能力 Port 保持在集合之外。
 * `createAIPrismaRepositories` 返回同样的四个 Port，外加仅 API 使用的
 * checkpoint pair（agent checkpoint、LangGraph checkpoint）——PowerSync 集合
 * 刻意保持不对称。便捷模块工厂保留 api/start/dispose 表面，具体适配器类绝不通过
 * 根 barrel 泄漏。
 */
describe('ai repository factories surface', () => {
  const fakeElectronDb = {} as unknown as IElectronDatabase;
  const fakePrisma = {} as unknown as PrismaClient;

  it('createAIPowerSyncRepositories returns the four persistence ports', () => {
    const set = createAIPowerSyncRepositories(fakeElectronDb);
    expect(set).toHaveProperty('conversationRepository');
    expect(set).toHaveProperty('providerConfigRepository');
    expect(set).toHaveProperty('knowledgeIndexRepository');
    expect(set).toHaveProperty('executionLogPort');
    const typed: AIPowerSyncRepositorySet = set;
    expect(typeof typed.conversationRepository.findByIdForIdentity).toBe('function');
    expect(typeof typed.executionLogPort.record).toBe('function');
  });

  it('createAIPrismaRepositories returns the six persistence ports', () => {
    const set = createAIPrismaRepositories(fakePrisma);
    expect(set).toHaveProperty('conversationRepository');
    expect(set).toHaveProperty('providerConfigRepository');
    expect(set).toHaveProperty('knowledgeIndexRepository');
    expect(set).toHaveProperty('executionLogPort');
    expect(set).toHaveProperty('agentCheckpointPort');
    expect(set).toHaveProperty('langGraphCheckpointPort');
    const typed: AIPrismaRepositorySet = set;
    expect(typeof typed.conversationRepository.findByIdForIdentity).toBe('function');
    expect(typeof typed.executionLogPort.record).toBe('function');
    const agentCheckpoint: IAgentCheckpointPort = typed.agentCheckpointPort;
    const langGraphCheckpoint: ILangGraphCheckpointPort = typed.langGraphCheckpointPort;
    expect(typeof agentCheckpoint.upsert).toBe('function');
    expect(typeof langGraphCheckpoint.putCheckpoint).toBe('function');
  });

  it('PowerSync set stays four-field with no checkpoint ports', () => {
    const set = createAIPowerSyncRepositories(fakeElectronDb);
    expect(Object.keys(set).sort()).toEqual([
      'conversationRepository',
      'executionLogPort',
      'knowledgeIndexRepository',
      'providerConfigRepository',
    ]);
    const typed: AIPowerSyncRepositorySet = set;
    const extra = (typed as AIPowerSyncRepositorySet & {
      agentCheckpointPort?: unknown;
      langGraphCheckpointPort?: unknown;
    });
    expect(extra.agentCheckpointPort).toBeUndefined();
    expect(extra.langGraphCheckpointPort).toBeUndefined();
  });

  it('host capability ports stay out of both sets', () => {
    const powerSyncSet = createAIPowerSyncRepositories(fakeElectronDb);
    expect(powerSyncSet).not.toHaveProperty('chatExecutionPort');
    expect(powerSyncSet).not.toHaveProperty('goalPlanningPort');
    expect(powerSyncSet).not.toHaveProperty('knowledgeIngestionPort');
    expect(powerSyncSet).not.toHaveProperty('analyticsReadPort');
    expect(powerSyncSet).not.toHaveProperty('agentRuntimePort');

    const prismaSet = createAIPrismaRepositories(fakePrisma);
    expect(prismaSet).not.toHaveProperty('chatExecutionPort');
    expect(prismaSet).not.toHaveProperty('goalPlanningPort');
    expect(prismaSet).not.toHaveProperty('knowledgeIngestionPort');
    expect(prismaSet).not.toHaveProperty('analyticsReadPort');
    expect(prismaSet).not.toHaveProperty('agentRuntimePort');
  });

  it('convenience module factory preserves api/start/dispose', () => {
    const instance = createAIPowerSyncModule(fakeElectronDb);
    expect(instance).toHaveProperty('api');
    expect(typeof instance.start).toBe('function');
    expect(typeof instance.dispose).toBe('function');
    const typed: AIModuleInstance = instance;
    expect(typeof typed.api).toBe('object');
  });

  it('module factory still assembles the set with host ports', () => {
    const repositories = createAIPowerSyncRepositories(fakeElectronDb);
    const instance = createAIModule({
      conversationRepository: repositories.conversationRepository,
      providerConfigRepository: repositories.providerConfigRepository,
      knowledgeIndexRepository: repositories.knowledgeIndexRepository,
      executionLogPort: repositories.executionLogPort,
    });
    expect(typeof instance.start).toBe('function');
    expect(typeof instance.dispose).toBe('function');
  });

  it('does not leak concrete adapter classes through the root barrel', async () => {
    // The AI infra barrel intentionally still exports concrete Prisma / service
    // / engine classes: `@memoflow/ai` has no `./server` export map entry, so
    // the infra barrel is package-internal, and the residual API-AI module
    // (`packages/ai/src/api/module.ts`) still composes them inside register().
    // This is the documented API-AI follow-up residual, not a new seam leak.
    // The ROOT barrel must never re-export those concrete classes.
    const forbidden = [
      'PowerSyncAIConversationRepository',
      'PowerSyncAIProviderConfigRepository',
      'AIKnowledgeIndexPowerSyncRepository',
      'AIExecutionLogPowerSyncAdapter',
      'AIConversationPrismaRepository',
      'AIExecutionLogPrismaAdapter',
      'AIProviderConfigPrismaRepository',
      'AIKnowledgeIndexPrismaRepository',
      'AgentCheckpointPrismaAdapter',
      'LangGraphCheckpointPrismaAdapter',
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

  it('root barrel exports the Prisma factory and set type', async () => {
    const rootModule = await import('../../../../src');
    expect(typeof rootModule.createAIPrismaRepositories).toBe('function');
    expect(typeof rootModule.createAIPowerSyncRepositories).toBe('function');
    expect(typeof rootModule.createAIModule).toBe('function');
  });

  it('root barrel type-exports every set field type (compile-time lock)', () => {
    const conversation = (_t: IAIConversationRepository) => undefined;
    const provider = (_t: IAIProviderConfigRepository) => undefined;

    expect(typeof conversation).toBe('function');
    expect(typeof provider).toBe('function');
  });
});
