/**
 * Update Account Preferences
 *
 * 更新账户偏好用例
 */

import type { UpdateAccountPreferencesRequest } from '@dailyuse/contracts/account';
import type { IAccountApiClient } from '@dailyuse/infrastructure-client';
import { AccountContainer } from '@dailyuse/infrastructure-client';
import { Account } from '@dailyuse/domain-client/account';

/**
 * Update Account Preferences
 */
export class UpdateAccountPreferences {
  private static instance: UpdateAccountPreferences;

  private constructor(private readonly apiClient: IAccountApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAccountApiClient): UpdateAccountPreferences {
    const container = AccountContainer.getInstance();
    const client = apiClient || container.getApiClient();
    UpdateAccountPreferences.instance = new UpdateAccountPreferences(client);
    return UpdateAccountPreferences.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): UpdateAccountPreferences {
    if (!UpdateAccountPreferences.instance) {
      UpdateAccountPreferences.instance = UpdateAccountPreferences.createInstance();
    }
    return UpdateAccountPreferences.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    UpdateAccountPreferences.instance = undefined as unknown as UpdateAccountPreferences;
  }

  /**
   * 执行用例
   * @returns Account Entity
   */
  async execute(accountId: string, request: UpdateAccountPreferencesRequest): Promise<Account> {
    const dto = await this.apiClient.updatePreferences(accountId, request);
    return Account.fromClientDTO(dto);
  }
}
