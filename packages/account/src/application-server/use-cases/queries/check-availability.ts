/**
 * Check Availability Use Case
 */

import type { IAccountRepository } from '@/domain-server';
import type { CheckAvailabilityReq, CheckAvailabilityRes } from '@dailyuse/contracts/account';

export class CheckAvailabilityUseCase {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async execute(request: CheckAvailabilityReq): Promise<CheckAvailabilityRes> {
    if (request.type === 'EMAIL') {
      const exists = await this.accountRepository.existsByEmail(request.value);
      return { available: !exists };
    }

    if (request.type === 'NICKNAME') {
      // Nickname uniqueness check �?use findByUsername as proxy
      const exists = await this.accountRepository.existsByUsername(request.value);
      return { available: !exists };
    }

    return { available: false };
  }
}
