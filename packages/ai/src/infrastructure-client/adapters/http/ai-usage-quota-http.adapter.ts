/**
 * AI Usage Quota HTTP Adapter
 *
 * HTTP implementation of IAIUsageQuotaApiClient.
 */

import type { IHttpClient, IAIUsageQuotaApiClient } from '../types';
import type {
  AIUsageQuotaClientDTO,
  UpdateQuotaLimitReq,
} from '@dailyuse/contracts/ai';

/**
 * AI Usage Quota HTTP Adapter
 *
 * Implements IAIUsageQuotaApiClient using HTTP REST API calls.
 */
export class AIUsageQuotaHttpAdapter implements IAIUsageQuotaApiClient {
  private readonly baseUrl = '/ai/quota';

  constructor(private readonly httpClient: IHttpClient) {}

  // ===== Quota Operations =====

  async getQuota(): Promise<AIUsageQuotaClientDTO> {
    return this.httpClient.get(this.baseUrl);
  }

  async updateQuotaLimit(request: UpdateQuotaLimitReq): Promise<AIUsageQuotaClientDTO> {
    return this.httpClient.patch(`${this.baseUrl}/limit`, request);
  }

  async checkQuotaAvailability(tokensNeeded: number): Promise<boolean> {
    const response = await this.httpClient.get<{ available: boolean }>(
      `${this.baseUrl}/check`,
      { params: { tokens: tokensNeeded } },
    );
    return response.available;
  }
}
