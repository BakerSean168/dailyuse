import type { IAIProviderConfigApiClient, IResultIpcClient } from '../types';
import { AIChannels } from '@dailyuse/contracts/electron';
import type {
  AIProviderConfigClientDTO,
  CreateAIProviderConfigReq,
  SetDefaultAIProviderReq,
  TestAIProviderReq,
  TestAIProviderRes,
  UpdateAIProviderConfigReq,
} from '@dailyuse/contracts/ai';

export class AIProviderConfigIpcAdapter implements IAIProviderConfigApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async createProvider(request: CreateAIProviderConfigReq): Promise<AIProviderConfigClientDTO> {
    const result = await this.ipcClient.invoke<AIProviderConfigClientDTO>(
      AIChannels.PROVIDER_CREATE,
      request,
    );
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  async getProviders(): Promise<AIProviderConfigClientDTO[]> {
    const result = await this.ipcClient.invoke<
      AIProviderConfigClientDTO[] | { data: AIProviderConfigClientDTO[] }
    >(
      AIChannels.PROVIDER_LIST,
    );
    if (!result.ok) throw new Error(result.error.message);
    return Array.isArray(result.data) ? result.data : result.data.data;
  }

  async getProviderById(id: string): Promise<AIProviderConfigClientDTO> {
    const result = await this.ipcClient.invoke<AIProviderConfigClientDTO>(
      AIChannels.PROVIDER_GET,
      id,
    );
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
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
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  async deleteProvider(id: string): Promise<void> {
    const result = await this.ipcClient.invoke<void>(AIChannels.PROVIDER_DELETE, id);
    if (!result.ok) throw new Error(result.error.message);
  }

  async testConnection(request: TestAIProviderReq): Promise<TestAIProviderRes> {
    const result = await this.ipcClient.invoke<TestAIProviderRes>(
      AIChannels.PROVIDER_TEST,
      request,
    );
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  async setDefaultProvider(request: SetDefaultAIProviderReq): Promise<void> {
    const result = await this.ipcClient.invoke<void>(AIChannels.PROVIDER_SET_DEFAULT, request);
    if (!result.ok) throw new Error(result.error.message);
  }

  async refreshProviderModels(id: string): Promise<AIProviderConfigClientDTO> {
    const result = await this.ipcClient.invoke<AIProviderConfigClientDTO>(
      AIChannels.PROVIDER_REFRESH_MODELS,
      id,
    );
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }
}
