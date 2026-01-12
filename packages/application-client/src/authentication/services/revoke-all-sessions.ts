/**
 * Revoke All Sessions Use Case
 *
 * 撤销所有会话用例
 */

import type { RevokeAllSessionsRequest } from '@dailyuse/contracts/authentication';
import type { IAuthApiClient } from '@dailyuse/infrastructure-client';
import { AuthContainer } from '@dailyuse/infrastructure-client';

/**
 * Revoke All Sessions Use Case
 */
export class RevokeAllSessions {
  private static instance: RevokeAllSessions;

  private constructor(private readonly apiClient: IAuthApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAuthApiClient): RevokeAllSessions {
    const container = AuthContainer.getInstance();
    const client = apiClient || container.getApiClient();
    RevokeAllSessions.instance = new RevokeAllSessions(client);
    return RevokeAllSessions.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): RevokeAllSessions {
    if (!RevokeAllSessions.instance) {
      RevokeAllSessions.instance = RevokeAllSessions.createInstance();
    }
    return RevokeAllSessions.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    RevokeAllSessions.instance = undefined as unknown as RevokeAllSessions;
  }

  /**
   * 执行用例
   */
  async execute(input?: RevokeAllSessionsRequest): Promise<void> {
    return this.apiClient.revokeAllSessions(input);
  }
}
