import { computed, ref } from 'vue';
import type {
  CreateAIProviderConfigReq,
  TestAIProviderReq,
  TestAIProviderRes,
  UpdateAIProviderConfigReq,
} from '@dailyuse/contracts/ai';
import { AI_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';

export function useAI() {
  const service = useStrictInject(AI_SERVICE_KEY, 'AIService');
  const providers = ref<unknown[]>([]);
  const isLoadingProviders = ref(false);

  const hasProviders = computed(() => providers.value.length > 0);

  async function loadProviders() {
    isLoadingProviders.value = true;
    try {
      providers.value = (await service.listProviders()) as unknown[];
      return providers.value;
    } finally {
      isLoadingProviders.value = false;
    }
  }

  async function createProvider(request: CreateAIProviderConfigReq) {
    const provider = await service.createProvider(request);
    await loadProviders();
    return provider;
  }

  async function updateProvider(id: string, request: UpdateAIProviderConfigReq) {
    const provider = await service.updateProvider(id, request);
    await loadProviders();
    return provider;
  }

  async function deleteProvider(id: string) {
    await service.deleteProvider(id);
    await loadProviders();
  }

  async function setDefaultProvider(providerId: string) {
    await service.setDefaultProvider(providerId);
    await loadProviders();
  }

  function testProvider(request: TestAIProviderReq): Promise<TestAIProviderRes> {
    return service.testProvider(request) as Promise<TestAIProviderRes>;
  }

  return {
    service,
    providers,
    hasProviders,
    isLoadingProviders,
    loadProviders,
    createProvider,
    updateProvider,
    deleteProvider,
    setDefaultProvider,
    testProvider,
  };
}
