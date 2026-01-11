/**
 * Update Account Profile Service
 *
 * 更新账户资料
 */

import type { IAccountRepository } from '@dailyuse/domain-server/account';
import type { AccountClientDTO, UpdateAccountProfileRequest } from '@dailyuse/contracts/account';
import { AccountContainer } from '@dailyuse/infrastructure-server';

/**
 * Update Account Profile Service
 */
export class UpdateAccountProfile {
  private static instance: UpdateAccountProfile;

  private constructor(private readonly accountRepository: IAccountRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(accountRepository?: IAccountRepository): UpdateAccountProfile {
    const container = AccountContainer.getInstance();
    const repo = accountRepository || container.getAccountRepository();
    UpdateAccountProfile.instance = new UpdateAccountProfile(repo);
    return UpdateAccountProfile.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): UpdateAccountProfile {
    if (!UpdateAccountProfile.instance) {
      UpdateAccountProfile.instance = UpdateAccountProfile.createInstance();
    }
    return UpdateAccountProfile.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    UpdateAccountProfile.instance = undefined as unknown as UpdateAccountProfile;
  }

  async execute(accountUuid: string, input: UpdateAccountProfileRequest): Promise<AccountClientDTO> {
    const account = await this.accountRepository.findById(accountUuid);
    if (!account) {
      throw new Error(`Account ${accountUuid} not found`);
    }

    // 使用 Account 的 updateProfile 方法
    account.updateProfile({
      displayName: input.displayName,
      avatar: input.avatar,
      bio: input.bio,
      timezone: input.timezone,
      language: input.language,
    });

    await this.accountRepository.save(account);

    return account.toClientDTO();
  }
}
