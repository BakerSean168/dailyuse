/**
 * Reset Password Use Case
 *
 * 重置密码用例
 */

import type { ResetPasswordRequest } from '@dailyuse/contracts/authentication';
import type { IAuthApiClient } from '@dailyuse/infrastructure-client';
import { AuthContainer } from '@dailyuse/infrastructure-client';

/**
 * Reset Password Use Case
 */
export class ResetPassword {
  private static instance: ResetPassword;

  private constructor(private readonly apiClient: IAuthApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAuthApiClient): ResetPassword {
    const container = AuthContainer.getInstance();
    const client = apiClient || container.getApiClient();
    ResetPassword.instance = new ResetPassword(client);
    return ResetPassword.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ResetPassword {
    if (!ResetPassword.instance) {
      ResetPassword.instance = ResetPassword.createInstance();
    }
    return ResetPassword.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ResetPassword.instance = undefined as unknown as ResetPassword;
  }

  /**
   * 执行用例
   */
  async execute(input: ResetPasswordRequest): Promise<void> {
    return this.apiClient.resetPassword(input);
  }
}
