/**
 * Check Availability Use Case
 */

import type { Result } from '@memoflow/contracts/result';
import { ok } from '@memoflow/contracts/result';
import type { IAccountRepository } from '../../../domain';
import type { CheckAvailabilityReq, CheckAvailabilityRes } from '@memoflow/contracts/account';

export class CheckAvailabilityUseCase {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async execute(request: CheckAvailabilityReq): Promise<Result<CheckAvailabilityRes>> {
    if (request.type === 'email') {
      const exists = await this.accountRepository.existsByEmail(request.value);
      return ok({ available: !exists });
    }

    if (request.type === 'nickname') {
      const exists = await this.accountRepository.existsByNickname(request.value);
      return ok({ available: !exists });
    }

    return ok({ available: false });
  }
}
