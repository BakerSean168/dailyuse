/**
 * Get Active Sessions Use Case
 *
 * 获取活跃会话列表用例
 */

import type { GetActiveSessionsRequest, ActiveSessionsResponse } from '@dailyuse/contracts/authentication';
import type { IAuthApiClient } from '@dailyuse/infrastructure-client';
import { AuthContainer } from '@dailyuse/infrastructure-client';

/**
 * Get Active Sessions Use Case
 */
export class GetActiveSessions {
  private static instance: GetActiveSessions;

  private constructor(private readonly apiClient: IAuthApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAuthApiClient): GetActiveSessions {
    const container = AuthContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetActiveSessions.instance = new GetActiveSessions(client);
    return GetActiveSessions.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetActiveSessions {
    if (!GetActiveSessions.instance) {
      GetActiveSessions.instance = GetActiveSessions.createInstance();
    }
    return GetActiveSessions.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetActiveSessions.instance = undefined as unknown as GetActiveSessions;
  }

  /**
   * 执行用例
   */
  async execute(input?: GetActiveSessionsRequest): Promise<ActiveSessionsResponse> {
    return this.apiClient.getActiveSessions(input);
  }
}
