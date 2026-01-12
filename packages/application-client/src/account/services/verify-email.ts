/**
 * Verify Email
 *
 * 验证邮箱用例
 */

import type { AccountDTO, VerifyEmailRequest } from '@dailyuse/contracts/account';
import type { IAccountApiClient } from '@dailyuse/infrastructure-client';
import { AccountContainer } from '@dailyuse/infrastructure-client';

/**
 * Verify Email
 */
export class VerifyEmail {
  private static instance: VerifyEmail;

  private constructor(private readonly apiClient: IAccountApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAccountApiClient): VerifyEmail {
    const container = AccountContainer.getInstance();
    const client = apiClient || container.getApiClient();
    VerifyEmail.instance = new VerifyEmail(client);
    return VerifyEmail.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): VerifyEmail {
    if (!VerifyEmail.instance) {
      VerifyEmail.instance = VerifyEmail.createInstance();
    }
    return VerifyEmail.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    VerifyEmail.instance = undefined as unknown as VerifyEmail;
  }

  /**
   * 执行用例
   */
  async execute(accountId: string, request: VerifyEmailRequest): Promise<AccountDTO> {
    return this.apiClient.verifyEmail(accountId, request);
  }
}
