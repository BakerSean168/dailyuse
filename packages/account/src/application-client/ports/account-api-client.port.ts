/**
 * Account API Client Port Interface
 */

import type { Result } from '@dailyuse/contracts/result';
import type { AccountClientDTO } from '@dailyuse/contracts/account';
import type { UpdateAccountReq, CheckAvailabilityReq, CheckAvailabilityRes, CloseAccountReq } from '@dailyuse/contracts/account';

export interface IAccountApiClient {
  getMyProfile(): Promise<Result<AccountClientDTO>>;
  updateMyProfile(request: UpdateAccountReq): Promise<Result<AccountClientDTO>>;
  checkAvailability(request: CheckAvailabilityReq): Promise<Result<CheckAvailabilityRes>>;
  closeAccount(request: CloseAccountReq): Promise<Result<void>>;
}
