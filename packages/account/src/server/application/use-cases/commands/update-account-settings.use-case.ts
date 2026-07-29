/**
 * Update Account Settings Use Case
 */

import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import type { IAccountRepository } from '../../../domain';
import type { UpdateAccountSettingsReq, AccountSettingsDTO } from '@memoflow/contracts/account';
import type { ThemeType, LanguageCode } from '../../../domain/value-objects';

export class UpdateAccountSettingsUseCase {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async execute(
    request: UpdateAccountSettingsReq,
    cx: ExecutionContext,
  ): Promise<Result<AccountSettingsDTO>> {
    const account = await this.accountRepository.findById(cx.identityId);
    if (!account) {
      return error('NOT_FOUND', `Account not found: ${cx.identityId}`);
    }

    let settings = account.settings;

    if (request.theme) {
      settings = settings.switchTheme(request.theme as ThemeType);
    }
    if (request.language) {
      settings = settings.switchLanguage(request.language as LanguageCode);
    }
    if (request.timezone) {
      settings = settings.setTimezone(request.timezone);
    }
    if (request.notificationEnabled !== undefined) {
      settings = request.notificationEnabled
        ? settings.enableNotification()
        : settings.disableNotification();
    }

    account.updateSettings(settings);
    await this.accountRepository.save(account);

    return ok(settings.toDTO());
  }
}
