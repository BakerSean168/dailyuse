import type { IAIProviderConfigApiClient, IResultHttpClient } from '../types';
import type {
  AIProviderConfigClientDTO,
  CreateAIProviderConfigReq,
  ListAIProviderConfigsRes,
  SetDefaultAIProviderReq,
  TestAIProviderReq,
  TestAIProviderRes,
  UpdateAIProviderConfigReq,
} from '@dailyuse/contracts/ai';
import { map, type Result } from '@dailyuse/contracts/result';

/**
 * HTTP adapter for AI provider-config ports.
 * Returns Result envelopes — never throws (no unwrap dual-track).
 */
export class AIProviderConfigHttpAdapter implements IAIProviderConfigApiClient {
  private readonly baseUrl = '/ai/providers';

  constructor(private readonly httpClient: IResultHttpClient) {}

  async createProvider(
    request: CreateAIProviderConfigReq,
  ): Promise<Result<AIProviderConfigClientDTO>> {
    return this.httpClient.post<AIProviderConfigClientDTO>(this.baseUrl, request);
  }

  async getProviders(): Promise<Result<AIProviderConfigClientDTO[]>> {
    const result = await this.httpClient.get<ListAIProviderConfigsRes>(this.baseUrl);
    return map(result, (envelope) => envelope.data);
  }

  async getProviderById(id: string): Promise<Result<AIProviderConfigClientDTO>> {
    return this.httpClient.get<AIProviderConfigClientDTO>(`${this.baseUrl}/${id}`);
  }

  async updateProvider(
    id: string,
    request: UpdateAIProviderConfigReq,
  ): Promise<Result<AIProviderConfigClientDTO>> {
    return this.httpClient.patch<AIProviderConfigClientDTO>(`${this.baseUrl}/${id}`, request);
  }

  async deleteProvider(id: string): Promise<Result<void>> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`);
  }

  async testConnection(request: TestAIProviderReq): Promise<Result<TestAIProviderRes>> {
    return this.httpClient.post<TestAIProviderRes>(`${this.baseUrl}/test`, request);
  }

  async setDefaultProvider(request: SetDefaultAIProviderReq): Promise<Result<void>> {
    return this.httpClient.post<void>(`${this.baseUrl}/${request.providerId}/set-default`);
  }

  async refreshProviderModels(id: string): Promise<Result<AIProviderConfigClientDTO>> {
    return this.httpClient.post<AIProviderConfigClientDTO>(
      `${this.baseUrl}/${id}/refresh-models`,
    );
  }
}
