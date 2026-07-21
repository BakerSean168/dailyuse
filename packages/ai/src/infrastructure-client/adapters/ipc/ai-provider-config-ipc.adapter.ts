import type { IAIProviderConfigApiClient, IResultIpcClient } from '../types';
import { AIChannels } from '@dailyuse/contracts/electron';
import type {
  AIProviderConfigClientDTO,
  CreateAIProviderConfigReq,
  ListAIProviderConfigsRes,
  SetDefaultAIProviderReq,
  TestAIProviderReq,
  TestAIProviderRes,
  UpdateAIProviderConfigReq,
} from '@dailyuse/contracts/ai';
import { unwrapResultOrThrow } from '../result-client-error';

export class AIProviderConfigIpcAdapter implements IAIProviderConfigApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async createProvider(request: CreateAIProviderConfigReq): Promise<AIProviderConfigClientDTO> {
    const result = await this.ipcClient.invoke<AIProviderConfigClientDTO>(
      AIChannels.PROVIDER_CREATE,
      request,
    );
    return unwrapResultOrThrow(result);
  }

  async getProviders(): Promise<AIProviderConfigClientDTO[]> {
    const result = await this.ipcClient.invoke<ListAIProviderConfigsRes>(AIChannels.PROVIDER_LIST);
    return unwrapResultOrThrow(result).data;
  }

  async getProviderById(id: string): Promise<AIProviderConfigClientDTO> {
    const result = await this.ipcClient.invoke<AIProviderConfigClientDTO>(
      AIChannels.PROVIDER_GET,
      id,
    );
    return unwrapResultOrThrow(result);
  }

  async updateProvider(
    id: string,
    request: UpdateAIProviderConfigReq,
  ): Promise<AIProviderConfigClientDTO> {
    const result = await this.ipcClient.invoke<AIProviderConfigClientDTO>(
      AIChannels.PROVIDER_UPDATE,
      {
        id,
        ...request,
      },
    );
    return unwrapResultOrThrow(result);
  }

  async deleteProvider(id: string): Promise<void> {
    const result = await this.ipcClient.invoke<void>(AIChannels.PROVIDER_DELETE, id);
    unwrapResultOrThrow(result);
  }

  async testConnection(request: TestAIProviderReq): Promise<TestAIProviderRes> {
    const result = await this.ipcClient.invoke<TestAIProviderRes>(
      AIChannels.PROVIDER_TEST,
      request,
    );
    return unwrapResultOrThrow(result);
  }

  async setDefaultProvider(request: SetDefaultAIProviderReq): Promise<void> {
    const result = await this.ipcClient.invoke<void>(AIChannels.PROVIDER_SET_DEFAULT, request);
    unwrapResultOrThrow(result);
  }

  async refreshProviderModels(id: string): Promise<AIProviderConfigClientDTO> {
    const result = await this.ipcClient.invoke<AIProviderConfigClientDTO>(
      AIChannels.PROVIDER_REFRESH_MODELS,
      id,
    );
    return unwrapResultOrThrow(result);
  }
}
