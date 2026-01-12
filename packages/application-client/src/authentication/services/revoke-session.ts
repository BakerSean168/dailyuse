/**
 * Revoke Session Use Case
 *
 * 撤销指定会话用例
 */

import type { RevokeSessionRequest } from '@dailyuse/contracts/authentication';
import type { IAuthApiClient } from '@dailyuse/infrastructure-client';
import { AuthContainer } from '@dailyuse/infrastructure-client';

/**
 * Revoke Session Use Case
 */
export class RevokeSession {
  private static instance: RevokeSession;

  private constructor(private readonly apiClient: IAuthApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAuthApiClient): RevokeSession {
    const container = AuthContainer.getInstance();
    const client = apiClient || container.getApiClient();
    RevokeSession.instance = new RevokeSession(client);
    return RevokeSession.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): RevokeSession {
    if (!RevokeSession.instance) {
      RevokeSession.instance = RevokeSession.createInstance();
    }
    return RevokeSession.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    RevokeSession.instance = undefined as unknown as RevokeSession;
  }

  /**
   * 执行用例
   */
  async execute(input: RevokeSessionRequest): Promise<void> {
    return this.apiClient.revokeSession(input);
  }
}
