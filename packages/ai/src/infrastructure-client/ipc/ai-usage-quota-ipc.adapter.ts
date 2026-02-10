/**
 * AI Usage Quota IPC Adapter
 *
 * IPC implementation of IAIUsageQuotaApiClient for Electron desktop app.
 */

import type { IAIUsageQuotaApiClient } from '../../ports/ai-usage-quota-api-client.port';
import type { IpcClient } from '../../../shared/ipc-client.types';
import type {
  AIUsageQuotaClientDTO,
  UpdateQuotaLimitRequest,
} from '@dailyuse/contracts/ai';

/**
 * AI Usage Quota IPC Adapter
 *
 * Implements IAIUsageQuotaApiClient using Electron IPC.
 */
export class AIUsageQuotaIpcAdapter implements IAIUsageQuotaApiClient {
  private readonly channel = 'ai:quota';

  constructor(private readonly ipcClient: IpcClient) {}

  // ===== Quota Operations =====

  async getQuota(): Promise<AIUsageQuotaClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:get`);
  }

  async updateQuotaLimit(request: UpdateQuotaLimitRequest): Promise<AIUsageQuotaClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:update-limit`, request);
  }

  async checkQuotaAvailability(tokensNeeded: number): Promise<boolean> {
    return this.ipcClient.invoke(`${this.channel}:check`, { tokens: tokensNeeded });
  }
}
