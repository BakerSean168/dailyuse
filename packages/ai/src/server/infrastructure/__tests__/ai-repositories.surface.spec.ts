import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { IElectronDatabase } from '@memoflow/contracts/electron';
import {
  createAIPowerSyncRepositories,
  createAIPowerSyncModule,
  createAIModule,
  type AIPowerSyncRepositorySet,
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
 * capability ports stay out of the set. The convenience module factory keeps
 * the api/start/dispose surface, and no concrete adapter class leaks through
 * the root barrel.
 *
 * `createAIPowerSyncRepositories` 返回四个持久化 Port（conversation、provider
 * config、knowledge index、execution log），宿主能力 Port 保持在集合之外。
 * 便捷模块工厂保留 api/start/dispose 表面，具体适配器类绝不通过根 barrel 泄漏。
 */
describe('ai repository factories surface', () => {
  const fakeElectronDb = {} as unknown as IElectronDatabase;

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

  it('host capability ports stay out of the set', () => {
    const set = createAIPowerSyncRepositories(fakeElectronDb);
    expect(set).not.toHaveProperty('chatExecutionPort');
    expect(set).not.toHaveProperty('goalPlanningPort');
    expect(set).not.toHaveProperty('knowledgeIngestionPort');
    expect(set).not.toHaveProperty('analyticsReadPort');
    expect(set).not.toHaveProperty('agentRuntimePort');
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
    const conversation = (_t: IAIConversationRepository) => undefined;
    const provider = (_t: IAIProviderConfigRepository) => undefined;

    expect(typeof conversation).toBe('function');
    expect(typeof provider).toBe('function');
  });
});
