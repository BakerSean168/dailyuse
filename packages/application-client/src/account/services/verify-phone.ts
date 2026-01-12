/**
 * Verify Phone
 *
 * 验证手机号用例
 */

import type { VerifyPhoneRequest } from '@dailyuse/contracts/account';
import type { IAccountApiClient } from '@dailyuse/infrastructure-client';
import { AccountContainer } from '@dailyuse/infrastructure-client';
import { Account } from '@dailyuse/domain-client/account';

/**
 * Verify Phone
 */
export class VerifyPhone {
  private static instance: VerifyPhone;

  private constructor(private readonly apiClient: IAccountApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAccountApiClient): VerifyPhone {
    const container = AccountContainer.getInstance();
    const client = apiClient || container.getApiClient();
    VerifyPhone.instance = new VerifyPhone(client);
    return VerifyPhone.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): VerifyPhone {
    if (!VerifyPhone.instance) {
      VerifyPhone.instance = VerifyPhone.createInstance();
    }
    return VerifyPhone.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    VerifyPhone.instance = undefined as unknown as VerifyPhone;
  }

  /**
   * 执行用例
   * @returns Account Entity
   */
  async execute(accountId: string, request: VerifyPhoneRequest): Promise<Account> {
    const dto = await this.apiClient.verifyPhone(accountId, request);
    return Account.fromClientDTO(dto);
  }
}
