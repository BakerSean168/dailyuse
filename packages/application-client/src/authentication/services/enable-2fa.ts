/**
 * Enable 2FA Use Case
 *
 * 启用两步验证用例
 */

import type { Enable2FARequest, Enable2FAResponseDTO } from '@dailyuse/contracts/authentication';
import type { IAuthApiClient } from '@dailyuse/infrastructure-client';
import { AuthContainer } from '@dailyuse/infrastructure-client';

/**
 * Enable 2FA Use Case
 */
export class Enable2FA {
  private static instance: Enable2FA;

  private constructor(private readonly apiClient: IAuthApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAuthApiClient): Enable2FA {
    const container = AuthContainer.getInstance();
    const client = apiClient || container.getApiClient();
    Enable2FA.instance = new Enable2FA(client);
    return Enable2FA.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): Enable2FA {
    if (!Enable2FA.instance) {
      Enable2FA.instance = Enable2FA.createInstance();
    }
    return Enable2FA.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    Enable2FA.instance = undefined as unknown as Enable2FA;
  }

  /**
   * 执行用例
   */
  async execute(input: Enable2FARequest): Promise<Enable2FAResponseDTO> {
    return this.apiClient.enable2FA(input);
  }
}
