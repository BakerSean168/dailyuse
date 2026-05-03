/**
 * Close Account Use Case
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { IAccountRepository } from '@/domain-server';
import type { CloseAccountReq } from '@dailyuse/contracts/account';

export class CloseAccountUseCase {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async execute(_request: CloseAccountReq, cx: ExecutionContext): Promise<Result<void>> {
    const account = await this.accountRepository.findById(cx.identityId);
    if (!account) {
      return error('NOT_FOUND', `Account not found: ${cx.identityId}`);
    }

    account.close();
    await this.accountRepository.save(account);

    return ok(undefined);
  }
}
