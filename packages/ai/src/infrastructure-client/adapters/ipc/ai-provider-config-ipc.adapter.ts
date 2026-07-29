import type { IAIProviderConfigApiClient, IResultIpcClient } from '../types';
import { AIChannels } from '@memoflow/contracts/electron';
import type {
  AIProviderConfigClientDTO,
  CreateAIProviderConfigReq,
  ListAIProviderConfigsRes,
  SetDefaultAIProviderReq,
  TestAIProviderReq,
  TestAIProviderRes,
  UpdateAIProviderConfigReq,
} from '@memoflow/contracts/ai';
import { map, type Result } from '@memoflow/contracts/result';

/**
 * IPC adapter for AI provider-config ports.
 * Returns Result envelopes — never throws (no unwrap dual-track).
 */
export class AIProviderConfigIpcAdapter implements IAIProviderConfigApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async createProvider(
    request: CreateAIProviderConfigReq,
  ): Promise<Result<AIProviderConfigClientDTO>> {
    return this.ipcClient.invoke<AIProviderConfigClientDTO>(AIChannels.PROVIDER_CREATE, request);
  }

  async getProviders(): Promise<Result<AIProviderConfigClientDTO[]>> {
    const result = await this.ipcClient.invoke<ListAIProviderConfigsRes>(AIChannels.PROVIDER_LIST);
    return map(result, (envelope) => envelope.data);
  }

  async getProviderById(id: string): Promise<Result<AIProviderConfigClientDTO>> {
    return this.ipcClient.invoke<AIProviderConfigClientDTO>(AIChannels.PROVIDER_GET, id);
  }

  async updateProvider(
    id: string,
    request: UpdateAIProviderConfigReq,
  ): Promise<Result<AIProviderConfigClientDTO>> {
    return this.ipcClient.invoke<AIProviderConfigClientDTO>(AIChannels.PROVIDER_UPDATE, {
      id,
      ...request,
    });
  }

  async deleteProvider(id: string): Promise<Result<void>> {
    return this.ipcClient.invoke<void>(AIChannels.PROVIDER_DELETE, id);
  }

  async testConnection(request: TestAIProviderReq): Promise<Result<TestAIProviderRes>> {
    return this.ipcClient.invoke<TestAIProviderRes>(AIChannels.PROVIDER_TEST, request);
  }

  async setDefaultProvider(request: SetDefaultAIProviderReq): Promise<Result<void>> {
    return this.ipcClient.invoke<void>(AIChannels.PROVIDER_SET_DEFAULT, request);
  }

  async refreshProviderModels(id: string): Promise<Result<AIProviderConfigClientDTO>> {
    return this.ipcClient.invoke<AIProviderConfigClientDTO>(
      AIChannels.PROVIDER_REFRESH_MODELS,
      id,
    );
  }
}
