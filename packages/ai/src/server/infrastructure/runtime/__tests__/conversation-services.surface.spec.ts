/**
 * Conversation service surface (stage-6 residual):
 * After dropping dual-track v1/v2 assembly, the host conversation API is
 * served only by the canonical use-case names (no *V2 fields).
 */
import { describe, expect, it, vi } from 'vitest';
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

describe('conversation services surface', () => {
  it('exposes canonical conversation use-case fields without V2 dual-track names', () => {
    const direct = createDirectProviderAIRuntime(createMockDeps());
    const remote = createRemoteAIServiceRuntime(createMockDeps());

    for (const runtime of [direct, remote]) {
      const keys = Object.keys(runtime.services.conversationServices).sort();
      expect(keys).toEqual(
        [
          'addMessage',
          'createConversation',
          'deleteConversation',
          'getByStatus',
          'getConversation',
          'listConversations',
          'updateConversation',
          'updateStatus',
        ].sort(),
      );
      expect(keys.some((key) => key.includes('V2') || key.includes('v2'))).toBe(false);
    }
  });

  it('routes createConversation through the canonical use case', async () => {
    const conversationRepository = createMockRepo<IAIConversationRepository>();
    vi.mocked(conversationRepository.save).mockResolvedValue(undefined as never);

    const runtime = createDirectProviderAIRuntime(
      createMockDeps({ conversationRepository }),
    );

    const result = await runtime.services.conversationServices.createConversation.execute(
      { identityId: 'identity-1' } as never,
      'Surface note',
    );

    expect(result.ok).toBe(true);
    expect(conversationRepository.save).toHaveBeenCalledOnce();
  });
});
