/**
 * Check Availability Use Case
 */

import type { IAccountRepository } from '@/domain-server';
import type { CheckAvailabilityReq, CheckAvailabilityRes } from '@dailyuse/contracts/account';

export class CheckAvailabilityUseCase {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async execute(request: CheckAvailabilityReq): Promise<CheckAvailabilityRes> {
    if (request.type === 'email') {
      const exists = await this.accountRepository.existsByEmail(request.value);
      return { available: !exists };
    }

    if (request.type === 'nickname') {
      const exists = await this.accountRepository.existsByNickname(request.value);
      return { available: !exists };
    }

    return { available: false };
  }
}
