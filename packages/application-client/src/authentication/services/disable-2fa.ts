/**
 * Disable 2FA Use Case
 *
 * 禁用两步验证用例
 */

import type { Disable2FARequest } from '@dailyuse/contracts/authentication';
import type { IAuthApiClient } from '@dailyuse/infrastructure-client';
import { AuthContainer } from '@dailyuse/infrastructure-client';

/**
 * Disable 2FA Use Case
 */
export class Disable2FA {
  private static instance: Disable2FA;

  private constructor(private readonly apiClient: IAuthApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAuthApiClient): Disable2FA {
    const container = AuthContainer.getInstance();
    const client = apiClient || container.getApiClient();
    Disable2FA.instance = new Disable2FA(client);
    return Disable2FA.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): Disable2FA {
    if (!Disable2FA.instance) {
      Disable2FA.instance = Disable2FA.createInstance();
    }
    return Disable2FA.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    Disable2FA.instance = undefined as unknown as Disable2FA;
  }

  /**
   * 执行用例
   */
  async execute(input: Disable2FARequest): Promise<void> {
    return this.apiClient.disable2FA(input);
  }
}
