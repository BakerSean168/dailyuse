/**
 * Update My Profile
 *
 * 更新当前用户资料用例
 * 
 * **返回 Entity 对象**
 */

import type { UpdateAccountProfileRequestDTO } from '@dailyuse/contracts/account';
import type { IAccountApiClient } from '@dailyuse/infrastructure-client';
import { AccountContainer } from '@dailyuse/infrastructure-client';
import { Account } from '@dailyuse/domain-client/account';

/**
 * Update My Profile Input
 */
export type UpdateMyProfileInput = UpdateAccountProfileRequestDTO;

/**
 * Update My Profile
 */
export class UpdateMyProfile {
  private static instance: UpdateMyProfile;

  private constructor(private readonly apiClient: IAccountApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAccountApiClient): UpdateMyProfile {
    const container = AccountContainer.getInstance();
    const client = apiClient || container.getApiClient();
    UpdateMyProfile.instance = new UpdateMyProfile(client);
    return UpdateMyProfile.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): UpdateMyProfile {
    if (!UpdateMyProfile.instance) {
      UpdateMyProfile.instance = UpdateMyProfile.createInstance();
    }
    return UpdateMyProfile.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    UpdateMyProfile.instance = undefined as unknown as UpdateMyProfile;
  }

  /**
   * 执行用例
   * @returns 返回 Entity 对象
   */
  async execute(request: UpdateMyProfileInput): Promise<Account> {
    const dto = await this.apiClient.updateMyProfile(request);
    return Account.fromClientDTO(dto);
  }
}

/**
 * 便捷函数
 */
export const updateMyProfile = (request: UpdateMyProfileInput): Promise<Account> =>
  UpdateMyProfile.getInstance().execute(request);
