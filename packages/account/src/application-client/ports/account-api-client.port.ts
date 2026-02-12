/**
 * Account API Client Port Interface
 */

import type { AccountClientDTO } from '@dailyuse/contracts/account';
import type { UpdateAccountReq, CheckAvailabilityReq, CheckAvailabilityRes, CloseAccountReq } from '@dailyuse/contracts/account';

export interface IAccountApiClient {
  getMyProfile(): Promise<AccountClientDTO>;
  updateMyProfile(request: UpdateAccountReq): Promise<AccountClientDTO>;
  checkAvailability(request: CheckAvailabilityReq): Promise<CheckAvailabilityRes>;
  closeAccount(request: CloseAccountReq): Promise<void>;
}
