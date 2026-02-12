/**
 * Get Quota
 *
 * 获取 AI 使用配额用例
 */

import type { IAIUsageQuotaApiClient } from '../../infrastructure-client/adapters/types';
import type { AIUsageQuotaClientDTO } from '@dailyuse/contracts/ai';
import { AIContainer } from '../../infrastructure-client/ai.container';

/**
 * Get Quota
 */
export class GetQuota {
  private static instance: GetQuota;

  private constructor(private readonly apiClient: IAIUsageQuotaApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAIUsageQuotaApiClient): GetQuota {
    const container = AIContainer.getInstance();
    const client = apiClient || container.getUsageQuotaApiClient();
    GetQuota.instance = new GetQuota(client);
    return GetQuota.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetQuota {
    if (!GetQuota.instance) {
      GetQuota.instance = GetQuota.createInstance();
    }
    return GetQuota.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetQuota.instance = undefined as unknown as GetQuota;
  }

  /**
   * 执行用例
   */
  async execute(): Promise<AIUsageQuotaClientDTO> {
    return this.apiClient.getQuota();
  }
}

/**
 * 便捷函数
 */
export const getQuota = (): Promise<AIUsageQuotaClientDTO> =>
  GetQuota.getInstance().execute();
