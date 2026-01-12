/**
 * Deactivate Account
 *
 * 停用账户用例
 * 
 * **返回 Entity 对象**
 */

import type { IAccountApiClient } from '@dailyuse/infrastructure-client';
import { AccountContainer } from '@dailyuse/infrastructure-client';
import { Account } from '@dailyuse/domain-client/account';

/**
 * Deactivate Account
 */
export class DeactivateAccount {
  private static instance: DeactivateAccount;

  private constructor(private readonly apiClient: IAccountApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAccountApiClient): DeactivateAccount {
    const container = AccountContainer.getInstance();
    const client = apiClient || container.getApiClient();
    DeactivateAccount.instance = new DeactivateAccount(client);
    return DeactivateAccount.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): DeactivateAccount {
    if (!DeactivateAccount.instance) {
      DeactivateAccount.instance = DeactivateAccount.createInstance();
    }
    return DeactivateAccount.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    DeactivateAccount.instance = undefined as unknown as DeactivateAccount;
  }

  /**
   * 执行用例
   * @returns 返回 Entity 对象
   */
  async execute(accountId: string): Promise<Account> {
    const dto = await this.apiClient.deactivateAccount(accountId);
    return Account.fromClientDTO(dto);
  }
}

/**
 * 便捷函数
 */
export const deactivateAccount = (accountId: string): Promise<Account> =>
  DeactivateAccount.getInstance().execute(accountId);
