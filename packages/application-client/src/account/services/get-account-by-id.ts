/**
 * Get Account By Id
 *
 * 获取账户详情用例
 * 
 * **返回 Entity 对象**
 */

import type { IAccountApiClient } from '@dailyuse/infrastructure-client';
import { AccountContainer } from '@dailyuse/infrastructure-client';
import { Account } from '@dailyuse/domain-client/account';

/**
 * Get Account By Id
 */
export class GetAccountById {
  private static instance: GetAccountById;

  private constructor(private readonly apiClient: IAccountApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAccountApiClient): GetAccountById {
    const container = AccountContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetAccountById.instance = new GetAccountById(client);
    return GetAccountById.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetAccountById {
    if (!GetAccountById.instance) {
      GetAccountById.instance = GetAccountById.createInstance();
    }
    return GetAccountById.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetAccountById.instance = undefined as unknown as GetAccountById;
  }

  /**
   * 执行用例
   * @returns 返回 Entity 对象
   */
  async execute(accountId: string): Promise<Account> {
    const dto = await this.apiClient.getAccountById(accountId);
    return Account.fromClientDTO(dto);
  }
}

/**
 * 便捷函数
 */
export const getAccountById = (accountId: string): Promise<Account> =>
  GetAccountById.getInstance().execute(accountId);
