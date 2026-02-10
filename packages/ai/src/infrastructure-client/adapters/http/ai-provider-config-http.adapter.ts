/**
 * AI Provider Config HTTP Adapter
 *
 * HTTP implementation of IAIProviderConfigApiClient.
 */

import type { IAIProviderConfigApiClient } from '../../ports/ai-provider-config-api-client.port';
import type { HttpClient } from '../../../shared/http-client.types';
import type {
  AIProviderConfigClientDTO,
  AIProviderConfigSummary,
  CreateAIProviderRequest,
  UpdateAIProviderRequest,
  TestAIProviderConnectionRequest,
  TestAIProviderConnectionResponse,
  RefreshProviderModelsResponse,
} from '@dailyuse/contracts/ai';

/**
 * AI Provider Config HTTP Adapter
 *
 * Implements IAIProviderConfigApiClient using HTTP REST API calls.
 */
export class AIProviderConfigHttpAdapter implements IAIProviderConfigApiClient {
  private readonly baseUrl = '/ai/providers';

  constructor(private readonly httpClient: HttpClient) {}

  // ===== Provider CRUD =====

  async createProvider(request: CreateAIProviderRequest): Promise<AIProviderConfigClientDTO> {
    return this.httpClient.post(this.baseUrl, request);
  }

  async getProviders(): Promise<AIProviderConfigSummary[]> {
    return this.httpClient.get(this.baseUrl);
  }

  async getProviderById(uuid: string): Promise<AIProviderConfigClientDTO> {
    return this.httpClient.get(`${this.baseUrl}/${uuid}`);
  }

  async updateProvider(
    uuid: string,
    request: UpdateAIProviderRequest,
  ): Promise<AIProviderConfigClientDTO> {
    return this.httpClient.patch(`${this.baseUrl}/${uuid}`, request);
  }

  async deleteProvider(uuid: string): Promise<void> {
    return this.httpClient.delete(`${this.baseUrl}/${uuid}`);
  }

  // ===== Provider Operations =====

  async testConnection(request: TestAIProviderConnectionRequest): Promise<TestAIProviderConnectionResponse> {
    return this.httpClient.post(`${this.baseUrl}/test-connection`, request);
  }

  async setDefaultProvider(uuid: string): Promise<void> {
    return this.httpClient.post(`${this.baseUrl}/${uuid}/set-default`);
  }

  async refreshModels(uuid: string): Promise<RefreshProviderModelsResponse> {
    return this.httpClient.post(`${this.baseUrl}/${uuid}/refresh-models`);
  }
}
