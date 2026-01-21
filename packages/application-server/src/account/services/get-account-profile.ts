/**
 * Get Account Profile Service
 *
 * 获取账户资料
 */

import type { IAccountRepository } from '@dailyuse/domain-server/account';
import type { AccountClientDTO } from '@dailyuse/contracts/account';

/**
 * Get Account Profile Service
 */
export class GetAccountProfile {
  constructor(private readonly accountRepository: IAccountRepository) {}

  /**
   * 执行获取资料
   */
  async execute(accountUuid: string): Promise<AccountClientDTO | null> {
    const account = await this.accountRepository.findById(accountUuid);
    if (!account) {
      return null;
    }
    return account.toClientDTO();
  }
}
