/**
 * Check Quota Availability
 *
 * 检�?AI 配额是否足够用例
 */

import type { IAIUsageQuotaApiClient } from '@/infrastructure-client';
import { AIContainer } from '@/infrastructure-client';

/**
 * Check Quota Availability
 */
export class CheckQuotaAvailability {
  private static instance: CheckQuotaAvailability;

  private constructor(private readonly apiClient: IAIUsageQuotaApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAIUsageQuotaApiClient): CheckQuotaAvailability {
    const container = AIContainer.getInstance();
    const client = apiClient || container.getUsageQuotaApiClient();
    CheckQuotaAvailability.instance = new CheckQuotaAvailability(client);
    return CheckQuotaAvailability.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CheckQuotaAvailability {
    if (!CheckQuotaAvailability.instance) {
      CheckQuotaAvailability.instance = CheckQuotaAvailability.createInstance();
    }
    return CheckQuotaAvailability.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CheckQuotaAvailability.instance = undefined as unknown as CheckQuotaAvailability;
  }

  /**
   * 执行用例
   */
  async execute(tokensNeeded: number): Promise<boolean> {
    return this.apiClient.checkQuotaAvailability(tokensNeeded);
  }
}

/**
 * 便捷函数
 */
export const checkQuotaAvailability = (tokensNeeded: number): Promise<boolean> =>
  CheckQuotaAvailability.getInstance().execute(tokensNeeded);
