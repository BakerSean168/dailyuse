/**
 * Logout Use Case
 *
 * 用户登出用例
 */

import type { LogoutRequest } from '@dailyuse/contracts/authentication';
import type { IAuthApiClient } from '@dailyuse/infrastructure-client';
import { AuthContainer } from '@dailyuse/infrastructure-client';

/**
 * Logout Use Case
 */
export class Logout {
  private static instance: Logout;

  private constructor(private readonly apiClient: IAuthApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAuthApiClient): Logout {
    const container = AuthContainer.getInstance();
    const client = apiClient || container.getApiClient();
    Logout.instance = new Logout(client);
    return Logout.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): Logout {
    if (!Logout.instance) {
      Logout.instance = Logout.createInstance();
    }
    return Logout.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    Logout.instance = undefined as unknown as Logout;
  }

  /**
   * 执行用例
   */
  async execute(input?: LogoutRequest): Promise<void> {
    return this.apiClient.logout(input);
  }
}
