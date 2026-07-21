/**
 * Provider service surface (stage-6 residual):
 * Host provider assembly matches AIApplicationPort provider methods only.
 * Default provider is selected via setDefault + list/isDefault (no getDefault use case).
 */
import { describe, expect, it } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { IAIConversationRepository, IAIProviderConfigRepository } from '../../../domain';
import type { AIModuleDependencies } from '../../ai.module';
import { createDirectProviderAIRuntime } from '../direct-provider-ai.runtime';
import { createRemoteAIServiceRuntime } from '../remote-ai-service.runtime';

function createMockDeps(overrides?: Partial<AIModuleDependencies>): AIModuleDependencies {
  return {
    conversationRepository: createMockRepo<IAIConversationRepository>(),
    providerConfigRepository: createMockRepo<IAIProviderConfigRepository>(),
    ...overrides,
  };
}

describe('provider services surface', () => {
  it('exposes only transport-wired provider use cases without getDefault dual-track', () => {
    const direct = createDirectProviderAIRuntime(createMockDeps());
    const remote = createRemoteAIServiceRuntime(createMockDeps());

    for (const runtime of [direct, remote]) {
      const keys = Object.keys(runtime.services.providerServices).sort();
      expect(keys).toEqual(
        [
          'create',
          'delete',
          'get',
          'list',
          'refreshModels',
          'setDefault',
          'testConnection',
          'update',
        ].sort(),
      );
      expect(keys).not.toContain('getDefault');
    }
  });

  it('keeps setDefault and list for default-provider resolution without a getDefault field', () => {
    const runtime = createDirectProviderAIRuntime(createMockDeps());
    const services = runtime.services.providerServices;

    expect(typeof services.setDefault.execute).toBe('function');
    expect(typeof services.list.execute).toBe('function');
    expect(Object.prototype.hasOwnProperty.call(services, 'getDefault')).toBe(false);
  });
});
