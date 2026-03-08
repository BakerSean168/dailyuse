import type { IAIProviderConfigApiClient, IResultIpcClient } from '../types';
import type {
  AIProviderConfigClientDTO,
  AIProviderConfigSummary,
  CreateAIProviderConfigReq,
  SetDefaultAIProviderReq,
  TestAIProviderReq,
  TestAIProviderRes,
  UpdateAIProviderConfigReq,
} from '@dailyuse/contracts/ai';

export class AIProviderConfigIpcAdapter implements IAIProviderConfigApiClient {
  private readonly channel = 'ai:provider';

  constructor(private readonly ipcClient: IResultIpcClient) {}

  async createProvider(request: CreateAIProviderConfigReq): Promise<AIProviderConfigClientDTO> {
    const result = await this.ipcClient.invoke<AIProviderConfigClientDTO>(
      `${this.channel}:create`,
      request,
    );
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  async getProviders(): Promise<AIProviderConfigSummary[]> {
    const result = await this.ipcClient.invoke<{ data: AIProviderConfigSummary[] }>(
      `${this.channel}:list`,
    );
    if (!result.ok) throw new Error(result.error.message);
    return result.data.data;
  }

  async getProviderById(id: string): Promise<AIProviderConfigClientDTO> {
    const result = await this.ipcClient.invoke<AIProviderConfigClientDTO>(
      `${this.channel}:get`,
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
      `${this.channel}:update`,
      {
        id,
        ...request,
      },
    );
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  async deleteProvider(id: string): Promise<void> {
    const result = await this.ipcClient.invoke<void>(`${this.channel}:delete`, id);
    if (!result.ok) throw new Error(result.error.message);
  }

  async testConnection(request: TestAIProviderReq): Promise<TestAIProviderRes> {
    const result = await this.ipcClient.invoke<TestAIProviderRes>(`${this.channel}:test`, request);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  async setDefaultProvider(request: SetDefaultAIProviderReq): Promise<void> {
    const result = await this.ipcClient.invoke<void>(`${this.channel}:set-default`, request);
    if (!result.ok) throw new Error(result.error.message);
  }
}
