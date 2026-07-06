import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  AICapabilities,
  AIProviderConfigClientDTO,
  ExpandKnowledgeRes,
  TestAIProviderReq,
  TestAIProviderRes,
} from '@dailyuse/contracts/ai';
import { AI_SERVICE_KEY } from '../../../di/keys';
import { useAI } from './useAI';

type AIServiceStub = {
  listProviders: ReturnType<typeof vi.fn>;
  getCapabilities: ReturnType<typeof vi.fn>;
  testProvider: ReturnType<typeof vi.fn>;
  expandKnowledge: ReturnType<typeof vi.fn>;
};

function createProvider(
  overrides: Partial<AIProviderConfigClientDTO> = {},
): AIProviderConfigClientDTO {
  return {
    id: 'provider-1' as AIProviderConfigClientDTO['id'],
    identityId: 'identity-1' as AIProviderConfigClientDTO['identityId'],
    name: 'Primary Provider',
    providerType: 'openai_compatible',
    baseUrl: 'https://api.example.com/v1',
    apiKeyMasked: 'sk-****1234',
    defaultModel: 'gpt-4.1-mini',
    availableModels: [{ id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' }],
    isActive: true,
    isDefault: true,
    priority: 1,
    version: 1,
    createdAt: 1,
    updatedAt: 1,
    deletedAt: null,
    ...overrides,
  };
}

function createCapabilities(
  overrides: Partial<AICapabilities> = {},
): AICapabilities {
  return {
    runtimeMode: 'remote-ai-service',
    supportsChat: true,
    supportsGoalGeneration: true,
    supportsKnowledgeNotes: true,
    supportsKnowledgeQuery: true,
    supportsKnowledgeReindex: true,
    supportsAnalyticsQuery: true,
    supportsGoalAutomation: true,
    supportsAgentRuntime: true,
    supportsEvaluationReports: false,
    ...overrides,
  };
}

function createExpandKnowledgeResult(): ExpandKnowledgeRes {
  return {
    expandedContent: 'Expanded note content',
    citations: [],
    providerId: 'provider-1' as ExpandKnowledgeRes['providerId'],
    tokenUsage: {
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
    },
    processingTimeMs: 120,
    matchedResourceCount: 2,
  };
}

function createServiceStub(overrides: Partial<AIServiceStub> = {}): AIServiceStub {
  return {
    listProviders: vi.fn(),
    getCapabilities: vi.fn(),
    testProvider: vi.fn(),
    expandKnowledge: vi.fn(),
    ...overrides,
  };
}

function mountComposable(serviceOverrides: Partial<AIServiceStub> = {}) {
  let composable!: ReturnType<typeof useAI>;
  const service = createServiceStub(serviceOverrides);

  mount(
    defineComponent({
      setup() {
        composable = useAI();
        return () => h('div');
      },
    }),
    {
      global: {
        provide: {
          [AI_SERVICE_KEY as symbol]: service,
        },
      },
    },
  );

  return { composable, service };
}

describe('useAI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps provider results strongly typed at the composable seam', async () => {
    const providers = [createProvider(), createProvider({ id: 'provider-2' as AIProviderConfigClientDTO['id'], isDefault: false })];
    const { composable, service } = mountComposable({
      listProviders: vi.fn().mockResolvedValue(providers),
    });

    const loadedProviders: AIProviderConfigClientDTO[] = await composable.loadProviders();

    expect(service.listProviders).toHaveBeenCalledTimes(1);
    expect(loadedProviders).toEqual(providers);
    expect(composable.providers.value).toEqual(providers);
    expect(composable.hasProviders.value).toBe(true);
  });

  it('keeps capabilities and provider test responses strongly typed', async () => {
    const capabilities = createCapabilities();
    const providerTestResult: TestAIProviderRes = {
      ok: true,
      response: 'pong',
      model: 'gpt-4.1-mini',
      latencyMs: 42,
    };
    const expandKnowledgeResult = createExpandKnowledgeResult();
    const { composable, service } = mountComposable({
      getCapabilities: vi.fn().mockResolvedValue(capabilities),
      testProvider: vi.fn().mockResolvedValue(providerTestResult),
      expandKnowledge: vi.fn().mockResolvedValue(expandKnowledgeResult),
    });
    const request: TestAIProviderReq = {
      baseUrl: 'https://api.example.com/v1',
      apiKey: 'secret',
      model: 'gpt-4.1-mini',
    };

    const loadedCapabilities: AICapabilities = await composable.loadCapabilities();
    const loadedTestResult: TestAIProviderRes = await composable.testProvider(request);
    const expanded = await composable.expandKnowledge({ instruction: 'Expand this note' });

    expect(service.getCapabilities).toHaveBeenCalledTimes(1);
    expect(loadedCapabilities).toEqual(capabilities);
    expect(composable.capabilities.value).toEqual(capabilities);
    expect(service.testProvider).toHaveBeenCalledWith(request);
    expect(loadedTestResult).toEqual(providerTestResult);
    expect(expanded).toEqual(expandKnowledgeResult);
  });
});
