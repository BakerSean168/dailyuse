/**
 * Update Phone
 *
 * 更新手机号用例
 * 
 * **返回 Entity 对象**
 */

import type { UpdatePhoneRequest } from '@dailyuse/contracts/account';
import type { IAccountApiClient } from '@dailyuse/infrastructure-client';
import { AccountContainer } from '@dailyuse/infrastructure-client';
import { Account } from '@dailyuse/domain-client/account';

/**
 * Update Phone
 */
export class UpdatePhone {
  private static instance: UpdatePhone;

  private constructor(private readonly apiClient: IAccountApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAccountApiClient): UpdatePhone {
    const container = AccountContainer.getInstance();
    const client = apiClient || container.getApiClient();
    UpdatePhone.instance = new UpdatePhone(client);
    return UpdatePhone.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): UpdatePhone {
    if (!UpdatePhone.instance) {
      UpdatePhone.instance = UpdatePhone.createInstance();
    }
    return UpdatePhone.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    UpdatePhone.instance = undefined as unknown as UpdatePhone;
  }

  /**
   * 执行用例
   * @returns 返回 Entity 对象
   */
  async execute(accountId: string, request: UpdatePhoneRequest): Promise<Account> {
    const dto = await this.apiClient.updatePhone(accountId, request);
    return Account.fromClientDTO(dto);
  }
}
