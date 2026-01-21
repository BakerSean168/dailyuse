/**
 * Account Application Service
 * 账户应用服务（协调器）
 *
 * 职责：
 * - 协调各个账户相关的应用服务
 * - 提供统一的账户操作接口
 */

import { RegistrationApplicationService } from './registration-application-service';
import { AccountProfileApplicationService } from './account-profile-application-service';
import { AccountStatusApplicationService } from './account-status-application-service';
import { AccountEmailApplicationService } from './account-email-application-service';
import { AccountDeletionApplicationService } from './account-deletion-application-service';
import type {
  RegisterUserRequest,
  RegisterUserResponse,
} from './registration-application-service';
import type {
  UpdateProfileRequest,
  UpdateProfileResponse,
} from './account-profile-application-service';

export class AccountApplicationService {
  constructor(
    public readonly registrationService: RegistrationApplicationService,
    public readonly profileService: AccountProfileApplicationService,
    public readonly statusService: AccountStatusApplicationService,
    public readonly emailService: AccountEmailApplicationService,
    public readonly deletionService: AccountDeletionApplicationService,
  ) {}

  // Facade methods
  
  async registerUser(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    return this.registrationService.registerUser(request);
  }

  async updateProfile(request: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    return this.profileService.updateProfile(request);
  }

  // Add other facade methods as needed or expose services publicly (readonly props above)
}
