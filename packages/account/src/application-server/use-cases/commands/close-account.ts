/**
 * Close Account Use Case
 */

import type { IAccountRepository } from '@/domain-server';
import type { CloseAccountReq } from '@dailyuse/contracts/account';

export interface CloseAccountResult {
  success: boolean;
  message: string;
}

export class CloseAccountUseCase {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async execute(accountId: string, _request: CloseAccountReq): Promise<CloseAccountResult> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }

    // Aggregate root enforces invariants (cannot close already-deactivated, etc.)
    account.close();

    await this.accountRepository.save(account);

    return {
      success: true,
      message: 'Account closed successfully',
    };
  }
}
