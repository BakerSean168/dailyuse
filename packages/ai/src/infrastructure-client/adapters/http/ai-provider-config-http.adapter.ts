/**
 * AI Provider Config HTTP Adapter
 *
 * HTTP implementation of IAIProviderConfigApiClient.
 */

import type { IHttpClient, IAIProviderConfigApiClient } from '../types';
import type {
  AIProviderConfigClientDTO,
  AIProviderConfigSummary,
  CreateAIProviderConfigReq,
  UpdateAIProviderConfigReq,
  TestAIProviderReq,
  TestAIProviderRes,
  RefreshProviderModelsRes,
} from '@dailyuse/contracts/ai';

/**
 * AI Provider Config HTTP Adapter
 *
 * Implements IAIProviderConfigApiClient using HTTP REST API calls.
 */
export class AIProviderConfigHttpAdapter implements IAIProviderConfigApiClient {
  private readonly baseUrl = '/ai/providers';

  constructor(private readonly httpClient: IHttpClient) {}

  // ===== Provider CRUD =====

  async createProvider(request: CreateAIProviderConfigReq): Promise<AIProviderConfigClientDTO> {
    return this.httpClient.post(this.baseUrl, request);
  }

  async getProviders(): Promise<AIProviderConfigSummary[]> {
    return this.httpClient.get(this.baseUrl);
  }

  async getProviderById(id: string): Promise<AIProviderConfigClientDTO> {
    return this.httpClient.get(`${this.baseUrl}/${id}`);
  }

  async updateProvider(
    id: string,
    request: UpdateAIProviderConfigReq,
  ): Promise<AIProviderConfigClientDTO> {
    return this.httpClient.patch(`${this.baseUrl}/${id}`, request);
  }

  async deleteProvider(id: string): Promise<void> {
    return this.httpClient.delete(`${this.baseUrl}/${id}`);
  }

  // ===== Provider Operations =====

  async testConnection(request: TestAIProviderReq): Promise<TestAIProviderRes> {
    return this.httpClient.post(`${this.baseUrl}/test-connection`, request);
  }

  async setDefaultProvider(id: string): Promise<void> {
    return this.httpClient.post(`${this.baseUrl}/${id}/set-default`);
  }

  async refreshModels(id: string): Promise<RefreshProviderModelsRes> {
    return this.httpClient.post(`${this.baseUrl}/${id}/refresh-models`);
  }
}
