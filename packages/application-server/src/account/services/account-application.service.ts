/**
 * Account Application Service (Facade)
 * 账户应用服务（协调器）
 *
 * 职责：
 * - 协调各个账户相关的应用服务
 * - 提供统一的账户操作接口
 * - 处理跨服务的业务流程
 */

import { RegistrationApplicationService } from './registration-application.service';
import { AccountProfileApplicationService } from './account-profile-application.service';
import { AccountStatusApplicationService } from './account-status-application.service';
import { AccountEmailApplicationService } from './account-email-application.service';
import { AccountDeletionApplicationService } from './account-deletion-application.service';
import type {
  RegisterUserRequest,
  RegisterUserResponse,
} from './registration-application.service';
import type {
  UpdateProfileRequest,
  UpdateProfileResponse,
} from './account-profile-application.service';
import type {
  RecordLoginRequest,
  DeactivateAccountRequest,
  AccountResponse,
} from './account-status-application.service';
import type {
  UpdateEmailRequest,
  VerifyEmailRequest,
} from './account-email-application.service';
import type {
  DeleteAccountRequest,
  DeleteAccountResponse,
} from './account-deletion-application.service';
import type { AccountClientDTO } from '@dailyuse/contracts/account';

export class AccountApplicationService {
  private static instance: AccountApplicationService;

  private registrationService!: RegistrationApplicationService;
  private profileService!: AccountProfileApplicationService;
  private statusService!: AccountStatusApplicationService;
  private emailService!: AccountEmailApplicationService;
  private deletionService!: AccountDeletionApplicationService;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static async getInstance(): Promise<AccountApplicationService> {
    if (!AccountApplicationService.instance) {
      const instance = new AccountApplicationService();
      instance.registrationService = await RegistrationApplicationService.getInstance();
      instance.profileService = await AccountProfileApplicationService.getInstance();
      instance.statusService = await AccountStatusApplicationService.getInstance();
      instance.emailService = await AccountEmailApplicationService.getInstance();
      instance.deletionService = await AccountDeletionApplicationService.getInstance();
      AccountApplicationService.instance = instance;
    }
    return AccountApplicationService.instance;
  }

  // Registration
  async registerUser(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    return this.registrationService.registerUser(request);
  }

  // Profile
  async getAccount(accountUuid: string): Promise<AccountClientDTO> {
    return this.profileService.getProfile(accountUuid);
  }

  async updateProfile(request: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    return this.profileService.updateProfile(request);
  }

  // Status
  async recordLogin(request: RecordLoginRequest): Promise<AccountResponse> {
    return this.statusService.recordLogin(request);
  }

  async deactivateAccount(request: DeactivateAccountRequest): Promise<AccountResponse> {
    return this.statusService.deactivateAccount(request);
  }

  // Email
  async updateEmail(request: UpdateEmailRequest): Promise<AccountResponse> {
    return this.emailService.updateEmail(request);
  }

  async verifyEmail(request: VerifyEmailRequest): Promise<AccountResponse> {
    return this.emailService.verifyEmail(request);
  }

  // Deletion
  async deleteAccount(request: DeleteAccountRequest): Promise<DeleteAccountResponse> {
    return this.deletionService.deleteAccount(request);
  }
}
