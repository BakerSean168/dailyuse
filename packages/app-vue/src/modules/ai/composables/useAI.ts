import { computed, ref } from 'vue';
import type {
  AICapabilities,
  AIProviderConfigClientDTO,
  CreateAIProviderConfigReq,
  ExpandKnowledgeReq,
  TestAIProviderReq,
  TestAIProviderRes,
  UpdateAIProviderConfigReq,
} from '@dailyuse/contracts/ai';
import { unwrap } from '@dailyuse/contracts/result';
import { AI_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';

/**
 * AI provider/capabilities composable.
 * Provider-config methods consume Result ports (residual 96); other AI ports
 * still throw-unwrap at the adapter until migrated.
 */
export function useAI() {
  const service = useStrictInject(AI_SERVICE_KEY, 'AIService');
  const providers = ref<AIProviderConfigClientDTO[]>([]);
  const capabilities = ref<AICapabilities | null>(null);
  const isLoadingProviders = ref(false);
  const isLoadingCapabilities = ref(false);

  const hasProviders = computed(() => providers.value.length > 0);

  async function loadProviders() {
    isLoadingProviders.value = true;
    try {
      const nextProviders = unwrap(await service.listProviders());
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
      capabilities.value = await service.getCapabilities();
      return capabilities.value;
    } finally {
      isLoadingCapabilities.value = false;
    }
  }

  async function createProvider(request: CreateAIProviderConfigReq) {
    const provider = unwrap(await service.createProvider(request));
    await loadProviders();
    return provider;
  }

  async function updateProvider(id: string, request: UpdateAIProviderConfigReq) {
    const provider = unwrap(await service.updateProvider(id, request));
    await loadProviders();
    return provider;
  }

  async function deleteProvider(id: string) {
    unwrap(await service.deleteProvider(id));
    await loadProviders();
  }

  async function setDefaultProvider(providerId: string) {
    unwrap(await service.setDefaultProvider(providerId));
    await loadProviders();
  }

  async function refreshProviderModels(providerId: string) {
    const provider = unwrap(await service.refreshProviderModels(providerId));
    await loadProviders();
    return provider;
  }

  async function testProvider(request: TestAIProviderReq): Promise<TestAIProviderRes> {
    return unwrap(await service.testProvider(request));
  }

  function expandKnowledge(request: ExpandKnowledgeReq) {
    return service.expandKnowledge(request);
  }

  return {
    service,
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
