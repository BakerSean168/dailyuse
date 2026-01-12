/**
 * Change Password Use Case
 *
 * 修改密码用例
 */

import type { ChangePasswordRequest } from '@dailyuse/contracts/authentication';
import type { IAuthApiClient } from '@dailyuse/infrastructure-client';
import { AuthContainer } from '@dailyuse/infrastructure-client';

/**
 * Change Password Use Case
 */
export class ChangePassword {
  private static instance: ChangePassword;

  private constructor(private readonly apiClient: IAuthApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAuthApiClient): ChangePassword {
    const container = AuthContainer.getInstance();
    const client = apiClient || container.getApiClient();
    ChangePassword.instance = new ChangePassword(client);
    return ChangePassword.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ChangePassword {
    if (!ChangePassword.instance) {
      ChangePassword.instance = ChangePassword.createInstance();
    }
    return ChangePassword.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ChangePassword.instance = undefined as unknown as ChangePassword;
  }

  /**
   * 执行用例
   */
  async execute(input: ChangePasswordRequest): Promise<void> {
    return this.apiClient.changePassword(input);
  }
}
