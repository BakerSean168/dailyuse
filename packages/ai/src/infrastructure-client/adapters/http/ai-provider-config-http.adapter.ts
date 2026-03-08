import type { IAIProviderConfigApiClient, IResultHttpClient } from '../types';
import type {
  AIProviderConfigClientDTO,
  AIProviderConfigSummary,
  CreateAIProviderConfigReq,
  SetDefaultAIProviderReq,
  TestAIProviderReq,
  TestAIProviderRes,
  UpdateAIProviderConfigReq,
} from '@dailyuse/contracts/ai';

export class AIProviderConfigHttpAdapter implements IAIProviderConfigApiClient {
  private readonly baseUrl = '/ai/providers';

  constructor(private readonly httpClient: IResultHttpClient) {}

  async createProvider(request: CreateAIProviderConfigReq): Promise<AIProviderConfigClientDTO> {
    const result = await this.httpClient.post<AIProviderConfigClientDTO>(this.baseUrl, request);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  async getProviders(): Promise<AIProviderConfigSummary[]> {
    const result = await this.httpClient.get<{ data: AIProviderConfigSummary[] }>(this.baseUrl);
    if (!result.ok) throw new Error(result.error.message);
    return result.data.data;
  }

  async getProviderById(id: string): Promise<AIProviderConfigClientDTO> {
    const result = await this.httpClient.get<AIProviderConfigClientDTO>(`${this.baseUrl}/${id}`);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  async updateProvider(
    id: string,
    request: UpdateAIProviderConfigReq,
  ): Promise<AIProviderConfigClientDTO> {
    const result = await this.httpClient.patch<AIProviderConfigClientDTO>(
      `${this.baseUrl}/${id}`,
      request,
    );
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  async deleteProvider(id: string): Promise<void> {
    const result = await this.httpClient.delete<void>(`${this.baseUrl}/${id}`);
    if (!result.ok) throw new Error(result.error.message);
  }

  async testConnection(request: TestAIProviderReq): Promise<TestAIProviderRes> {
    const result = await this.httpClient.post<TestAIProviderRes>(`${this.baseUrl}/test`, request);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  async setDefaultProvider(request: SetDefaultAIProviderReq): Promise<void> {
    const result = await this.httpClient.post<void>(
      `${this.baseUrl}/${request.providerId}/set-default`,
    );
    if (!result.ok) throw new Error(result.error.message);
  }
}
