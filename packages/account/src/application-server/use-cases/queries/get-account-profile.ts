/**
 * Get Account Profile Use Case
 */

import type { IAccountRepository } from '@/domain-server';
import type { AccountClientDTO } from '@dailyuse/contracts/account';

export class GetAccountProfileUseCase {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async execute(accountId: string): Promise<AccountClientDTO | null> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      return null;
    }
    return account.toClientDTO();
  }
}
