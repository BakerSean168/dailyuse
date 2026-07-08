/**
 * Get Account Profile Use Case
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { IAccountRepository } from '../../../domain';
import type { AccountClientDTO } from '@dailyuse/contracts/account';

export class GetAccountProfileUseCase {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async execute(cx: ExecutionContext): Promise<Result<AccountClientDTO | null>> {
    const account = await this.accountRepository.findById(cx.identityId);
    if (!account) {
      return ok(null);
    }
    return ok(account.toClientDTO());
  }
}
