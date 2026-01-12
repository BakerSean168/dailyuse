/**
 * Activate Account
 *
 * 激活账户用例
 * 
 * **返回 Entity 对象**
 */

import type { IAccountApiClient } from '@dailyuse/infrastructure-client';
import { AccountContainer } from '@dailyuse/infrastructure-client';
import { Account } from '@dailyuse/domain-client/account';

/**
 * Activate Account
 */
export class ActivateAccount {
  private static instance: ActivateAccount;

  private constructor(private readonly apiClient: IAccountApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAccountApiClient): ActivateAccount {
    const container = AccountContainer.getInstance();
    const client = apiClient || container.getApiClient();
    ActivateAccount.instance = new ActivateAccount(client);
    return ActivateAccount.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ActivateAccount {
    if (!ActivateAccount.instance) {
      ActivateAccount.instance = ActivateAccount.createInstance();
    }
    return ActivateAccount.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ActivateAccount.instance = undefined as unknown as ActivateAccount;
  }

  /**
   * 执行用例
   * @returns 返回 Entity 对象
   */
  async execute(accountId: string): Promise<Account> {
    const dto = await this.apiClient.activateAccount(accountId);
    return Account.fromClientDTO(dto);
  }
}

/**
 * 便捷函数
 */
export const activateAccount = (accountId: string): Promise<Account> =>
  ActivateAccount.getInstance().execute(accountId);
