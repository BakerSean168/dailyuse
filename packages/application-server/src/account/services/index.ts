/**
 * Account Services Index
 *
 * 导出所有 Account 模块的 Application Services
 */

// Facade Service (主入口)
export { AccountApplicationService } from './account-application.service';

// Legacy Use Cases (keep for compatibility)
export { RegisterAccount } from './register-account';
export { GetAccountProfile } from './get-account-profile';
export { UpdateAccountProfile } from './update-account-profile';

// Individual Application Services (可单独使用)
export { AccountProfileApplicationService } from './account-profile-application.service';
export { AccountDeletionApplicationService } from './account-deletion-application.service';
export { AccountEmailApplicationService } from './account-email-application.service';
export { AccountStatusApplicationService } from './account-status-application.service';
export { RegistrationApplicationService } from './registration-application.service';

// Re-export types
export type {
  UpdateProfileRequest,
  UpdateProfileResponse,
} from './account-profile-application.service';
export type {
  DeleteAccountRequest,
  DeleteAccountResponse,
} from './account-deletion-application.service';
export type {
  UpdateEmailRequest,
  VerifyEmailRequest,
  AccountResponse,
} from './account-email-application.service';
export type {
  RecordLoginRequest,
  DeactivateAccountRequest,
} from './account-status-application.service';
export type {
  RegisterUserRequest,
  RegisterUserResponse,
} from './registration-application.service';
