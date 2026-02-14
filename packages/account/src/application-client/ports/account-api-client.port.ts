/**
 * Account API Client Port Interface
 *
 * 所有方法统一返回 Promise<Result<T>>，永不抛出异常。
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
