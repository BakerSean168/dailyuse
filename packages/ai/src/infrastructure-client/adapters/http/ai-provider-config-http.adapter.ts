import type { IAIProviderConfigApiClient, IResultHttpClient } from '../types';
import type {
  AIProviderConfigClientDTO,
  CreateAIProviderConfigReq,
  SetDefaultAIProviderReq,
  TestAIProviderReq,
  TestAIProviderRes,
  UpdateAIProviderConfigReq,
} from '@dailyuse/contracts/ai';
import { unwrapResultOrThrow } from '../result-client-error';

export class AIProviderConfigHttpAdapter implements IAIProviderConfigApiClient {
  private readonly baseUrl = '/ai/providers';

  constructor(private readonly httpClient: IResultHttpClient) {}

  async createProvider(request: CreateAIProviderConfigReq): Promise<AIProviderConfigClientDTO> {
    const result = await this.httpClient.post<AIProviderConfigClientDTO>(this.baseUrl, request);
    return unwrapResultOrThrow(result);
  }

  async getProviders(): Promise<AIProviderConfigClientDTO[]> {
    const result = await this.httpClient.get<{ data: AIProviderConfigClientDTO[] }>(this.baseUrl);
    return unwrapResultOrThrow(result).data;
  }

  async getProviderById(id: string): Promise<AIProviderConfigClientDTO> {
    const result = await this.httpClient.get<AIProviderConfigClientDTO>(`${this.baseUrl}/${id}`);
    return unwrapResultOrThrow(result);
  }

  async updateProvider(
    id: string,
    request: UpdateAIProviderConfigReq,
  ): Promise<AIProviderConfigClientDTO> {
    const result = await this.httpClient.patch<AIProviderConfigClientDTO>(
      `${this.baseUrl}/${id}`,
      request,
    );
    return unwrapResultOrThrow(result);
  }

  async deleteProvider(id: string): Promise<void> {
    const result = await this.httpClient.delete<void>(`${this.baseUrl}/${id}`);
    unwrapResultOrThrow(result);
  }

  async testConnection(request: TestAIProviderReq): Promise<TestAIProviderRes> {
    const result = await this.httpClient.post<TestAIProviderRes>(`${this.baseUrl}/test`, request);
    return unwrapResultOrThrow(result);
  }

  async setDefaultProvider(request: SetDefaultAIProviderReq): Promise<void> {
    const result = await this.httpClient.post<void>(
      `${this.baseUrl}/${request.providerId}/set-default`,
    );
    unwrapResultOrThrow(result);
  }

  async refreshProviderModels(id: string): Promise<AIProviderConfigClientDTO> {
    const result = await this.httpClient.post<AIProviderConfigClientDTO>(
      `${this.baseUrl}/${id}/refresh-models`,
    );
    return unwrapResultOrThrow(result);
  }
}
