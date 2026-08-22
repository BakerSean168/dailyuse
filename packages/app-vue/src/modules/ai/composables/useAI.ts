import { computed, ref } from 'vue';
import type {
  AICapabilities,
  AIProviderConfigClientDTO,
  CreateAIProviderConfigReq,
  ExpandKnowledgeReq,
  TestAIProviderReq,
  TestAIProviderRes,
  UpdateAIProviderConfigReq,
} from '@memoflow/contracts/ai';
import { unwrap } from '@memoflow/contracts/result';
import { AI_CLIENT_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';

/**
 * AI provider/capabilities composable.
 * Provider/capabilities/conversation/goal/knowledge/analytics methods consume
 * Result ports (residual 96–98); message/stream/agent still throw-unwrap.
 */
export function useAI() {
  const client = useStrictInject(AI_CLIENT_KEY, 'AIClient');
  const providers = ref<AIProviderConfigClientDTO[]>([]);
  const capabilities = ref<AICapabilities | null>(null);
  const isLoadingProviders = ref(false);
  const isLoadingCapabilities = ref(false);

  const hasProviders = computed(() => providers.value.length > 0);

  async function loadProviders() {
    isLoadingProviders.value = true;
    try {
      const nextProviders = unwrap(await client.listProviders());
      providers.value = nextProviders;
      console.debug('[AI] providers loaded', {
        count: providers.value.length,
        providerIds: providers.value.map((provider) => String(provider.id)).slice(0, 10),
      });
      return providers.value;
    } finally {
      isLoadingProviders.value = false;
    }
  }

  async function loadCapabilities() {
    isLoadingCapabilities.value = true;
    try {
      capabilities.value = unwrap(await client.getCapabilities());
      return capabilities.value;
    } finally {
      isLoadingCapabilities.value = false;
    }
  }

  async function createProvider(request: CreateAIProviderConfigReq) {
    const provider = unwrap(await client.createProvider(request));
    await loadProviders();
    return provider;
  }

  async function updateProvider(id: string, request: UpdateAIProviderConfigReq) {
    const provider = unwrap(await client.updateProvider(id, request));
    await loadProviders();
    return provider;
  }

  async function deleteProvider(id: string) {
    unwrap(await client.deleteProvider(id));
    await loadProviders();
  }

  async function setDefaultProvider(providerId: string) {
    unwrap(await client.setDefaultProvider(providerId));
    await loadProviders();
  }

  async function refreshProviderModels(providerId: string) {
    const provider = unwrap(await client.refreshProviderModels(providerId));
    await loadProviders();
    return provider;
  }

  async function testProvider(request: TestAIProviderReq): Promise<TestAIProviderRes> {
    return unwrap(await client.testProvider(request));
  }

  async function expandKnowledge(request: ExpandKnowledgeReq) {
    return unwrap(await client.expandKnowledge(request));
  }

  return {
    service: client,
    providers,
    capabilities,
    hasProviders,
    isLoadingProviders,
    isLoadingCapabilities,
    loadCapabilities,
    loadProviders,
    createProvider,
    updateProvider,
    deleteProvider,
    setDefaultProvider,
    refreshProviderModels,
    testProvider,
    expandKnowledge,
  };
}
