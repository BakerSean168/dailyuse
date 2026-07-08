/**
 * Check Availability Use Case
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { IAccountRepository } from '../../../domain';
import type { CheckAvailabilityReq, CheckAvailabilityRes } from '@dailyuse/contracts/account';

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
