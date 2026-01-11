/**
 * Get Account Profile Service
 *
 * 获取账户资料
 */

import type { IAccountRepository } from '@dailyuse/domain-server/account';
import type { AccountClientDTO } from '@dailyuse/contracts/account';
import { AccountContainer } from '@dailyuse/infrastructure-server';

/**
 * Get Account Profile Service
 */
export class GetAccountProfile {
  private static instance: GetAccountProfile;

  private constructor(private readonly accountRepository: IAccountRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(accountRepository?: IAccountRepository): GetAccountProfile {
    const container = AccountContainer.getInstance();
    const repo = accountRepository || container.getAccountRepository();
    GetAccountProfile.instance = new GetAccountProfile(repo);
    return GetAccountProfile.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetAccountProfile {
    if (!GetAccountProfile.instance) {
      GetAccountProfile.instance = GetAccountProfile.createInstance();
    }
    return GetAccountProfile.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetAccountProfile.instance = undefined as unknown as GetAccountProfile;
  }

  async execute(accountUuid: string): Promise<AccountClientDTO | null> {
    const account = await this.accountRepository.findById(accountUuid);
    return account ? account.toClientDTO() : null;
  }
}
