/**
 * Update Account Settings Use Case
 */

import type { IAccountRepository } from '@/domain-server';
import type { UpdateAccountSettingsReq, AccountSettingsDTO } from '@dailyuse/contracts/account';

export interface UpdateSettingsResult {
  success: boolean;
  settings: AccountSettingsDTO;
  message: string;
}

export class UpdateAccountSettingsUseCase {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async execute(accountId: string, request: UpdateAccountSettingsReq): Promise<UpdateSettingsResult> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }

    // Apply settings updates via value object immutability
    let settings = account.settings;

    if (request.theme) {
      settings = settings.switchTheme(request.theme as any);
    }
    if (request.language) {
      settings = settings.switchLanguage(request.language as any);
    }
    if (request.timezone) {
      settings = settings.setTimezone(request.timezone);
    }
    if (request.notificationEnabled !== undefined) {
      settings = request.notificationEnabled
        ? settings.enableNotification()
        : settings.disableNotification();
    }

    await this.accountRepository.save(account);

    return {
      success: true,
      settings: settings.toDTO(),
      message: 'Settings updated successfully',
    };
  }
}
