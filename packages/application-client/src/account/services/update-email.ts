/**
 * Update Email
 *
 * 更新邮箱用例
 * 
 * **返回 Entity 对象**
 */

import type { UpdateEmailRequest } from '@dailyuse/contracts/account';
import type { IAccountApiClient } from '@dailyuse/infrastructure-client';
import { AccountContainer } from '@dailyuse/infrastructure-client';
import { Account } from '@dailyuse/domain-client/account';

/**
 * Update Email
 */
export class UpdateEmail {
  private static instance: UpdateEmail;

  private constructor(private readonly apiClient: IAccountApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAccountApiClient): UpdateEmail {
    const container = AccountContainer.getInstance();
    const client = apiClient || container.getApiClient();
    UpdateEmail.instance = new UpdateEmail(client);
    return UpdateEmail.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): UpdateEmail {
    if (!UpdateEmail.instance) {
      UpdateEmail.instance = UpdateEmail.createInstance();
    }
    return UpdateEmail.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    UpdateEmail.instance = undefined as unknown as UpdateEmail;
  }

  /**
   * 执行用例
   * @returns 返回 Entity 对象
   */
  async execute(accountId: string, request: UpdateEmailRequest): Promise<Account> {
    const dto = await this.apiClient.updateEmail(accountId, request);
    return Account.fromClientDTO(dto);
  }
}
