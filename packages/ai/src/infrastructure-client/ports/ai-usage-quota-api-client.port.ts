/**
 * AI Usage Quota API Client Port Interface
 *
 * Defines the contract for AI Usage Quota API operations.
 * Implementations: AIUsageQuotaHttpAdapter (web), AIUsageQuotaIpcAdapter (desktop)
 */

import type {
  AIUsageQuotaClientDTO,
  UpdateQuotaLimitRequest,
} from '@dailyuse/contracts/ai';

/**
 * AI Usage Quota API Client Interface
 */
export interface IAIUsageQuotaApiClient {
  // ===== Quota Operations =====

  /** 获取当前配额 */
  getQuota(): Promise<AIUsageQuotaClientDTO>;

  /** 更新配额限制 */
  updateQuotaLimit(request: UpdateQuotaLimitRequest): Promise<AIUsageQuotaClientDTO>;

  /** 检查配额是否足够 */
  checkQuotaAvailability(tokensNeeded: number): Promise<boolean>;
}
