/**
 * Close Account Use Case
 */

import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import type { IAccountRepository } from '../../../domain';
import type { CloseAccountReq } from '@memoflow/contracts/account';

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
