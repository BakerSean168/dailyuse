/**
 * Update Account Profile Use Case
 */

import type { IAccountRepository } from '../../domain-server';
import type { AccountClientDTO, UpdateAccountReq } from '@dailyuse/contracts/account';

export interface UpdateProfileResult {
  success: boolean;
  account: AccountClientDTO;
  message: string;
}

export class UpdateAccountProfileUseCase {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async execute(accountId: string, request: UpdateAccountReq): Promise<UpdateProfileResult> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }

    // Apply profile updates via aggregate root
    // The aggregate root enforces domain invariants
    let profile = account.profile;

    if (request.nickname) {
      profile = profile.updateNickname(request.nickname);
    }
    if (request.avatar !== undefined) {
      profile = request.avatar ? profile.updateAvatar(request.avatar) : profile;
    }
    if (request.bio !== undefined) {
      profile = request.bio ? profile.updateBio(request.bio) : profile;
    }

    // Note: Settings updates (timezone, language) go through UpdateAccountSettingsUseCase

    await this.accountRepository.save(account);

    return {
      success: true,
      account: account.toClientDTO(),
      message: 'Profile updated successfully',
    };
  }
}
