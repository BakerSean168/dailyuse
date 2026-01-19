/**
 * Account Application Service
 *
 * Smart Container + Application Service Pattern
 * Framework-agnostic orchestration layer for account management
 *
 * @module application-client/account
 */

import type { Account, AccountProfile } from '@dailyuse/domain-client/account';
import type {
  UpdateProfileRequest,
  ChangePasswordRequest,
  UpdatePreferencesRequest,
  UpdateEmailRequest,
  UpdatePhoneRequest,
  SubscribePlanRequest,
} from '@dailyuse/contracts/account';
import {
  GetMyProfile,
  UpdateMyProfile,
  ChangeMyPassword,
  GetAccountById,
  UpdateAccountProfile,
  UpdateAccountPreferences,
  UpdateEmail,
  VerifyEmail,
  UpdatePhone,
  VerifyPhone,
  DeactivateAccount,
  ActivateAccount,
  DeleteAccount,
  GetAccountHistory,
  GetSubscription,
  SubscribePlan,
  CancelSubscription,
  GetAccountStats,
} from './services';

/**
 * Account Application Service
 *
 * @example
 * import { accountApplicationService } from '@dailyuse/application-client/account'
 * const profile = await accountApplicationService.getMyProfile()
 */
export class AccountApplicationService {
  // ===== Profile Operations =====

  async getMyProfile(): Promise<AccountProfile> {
    return GetMyProfile.getInstance().execute();
  }

  async updateMyProfile(request: UpdateProfileRequest): Promise<AccountProfile> {
    return UpdateMyProfile.getInstance().execute(request);
  }

  async changePassword(request: ChangePasswordRequest): Promise<void> {
    return ChangeMyPassword.getInstance().execute(request);
  }

  async getAccountById(uuid: string): Promise<Account> {
    return GetAccountById.getInstance().execute(uuid);
  }

  async updateProfile(uuid: string, request: UpdateProfileRequest): Promise<AccountProfile> {
    return UpdateAccountProfile.getInstance().execute(uuid, request);
  }

  async updatePreferences(uuid: string, request: UpdatePreferencesRequest): Promise<void> {
    return UpdateAccountPreferences.getInstance().execute(uuid, request);
  }

  async updateEmail(request: UpdateEmailRequest): Promise<void> {
    return UpdateEmail.getInstance().execute(request);
  }

  async verifyEmail(code: string): Promise<void> {
    return VerifyEmail.getInstance().execute(code);
  }

  async updatePhone(request: UpdatePhoneRequest): Promise<void> {
    return UpdatePhone.getInstance().execute(request);
  }

  async verifyPhone(code: string): Promise<void> {
    return VerifyPhone.getInstance().execute(code);
  }

  async deactivateAccount(): Promise<void> {
    return DeactivateAccount.getInstance().execute();
  }

  async activateAccount(uuid: string): Promise<void> {
    return ActivateAccount.getInstance().execute(uuid);
  }

  async deleteAccount(): Promise<void> {
    return DeleteAccount.getInstance().execute();
  }

  async getAccountHistory(uuid: string): Promise<any[]> {
    return GetAccountHistory.getInstance().execute(uuid);
  }

  // ===== Subscription Operations =====

  async getSubscription(): Promise<any> {
    return GetSubscription.getInstance().execute();
  }

  async subscribePlan(request: SubscribePlanRequest): Promise<any> {
    return SubscribePlan.getInstance().execute(request);
  }

  async cancelSubscription(): Promise<void> {
    return CancelSubscription.getInstance().execute();
  }

  async getAccountStats(): Promise<any> {
    return GetAccountStats.getInstance().execute();
  }
}

/**
 * Account Application Service 单例实例
 */
export const accountApplicationService = new AccountApplicationService();
