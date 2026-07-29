/**
 * Account API Client Port Interface
 */

import type { Result } from '@memoflow/contracts/result';
import type { AccountClientDTO } from '@memoflow/contracts/account';
import type {
  UpdateAccountReq,
  CheckAvailabilityReq,
  CheckAvailabilityRes,
  CloseAccountReq,
  UpdateAccountSettingsReq,
  UpdateAccountSettingsRes,
} from '@memoflow/contracts/account';

export interface IAccountApiClient {
  getMyProfile(): Promise<Result<AccountClientDTO>>;
  updateMyProfile(request: UpdateAccountReq): Promise<Result<AccountClientDTO>>;
  updateSettings(request: UpdateAccountSettingsReq): Promise<Result<UpdateAccountSettingsRes>>;
  checkAvailability(request: CheckAvailabilityReq): Promise<Result<CheckAvailabilityRes>>;
  closeAccount(request: CloseAccountReq): Promise<Result<void>>;
}
