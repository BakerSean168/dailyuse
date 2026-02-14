/**
 * Account HTTP Adapter
 *
 * HTTP implementation of IAccountApiClient.
 * 使用 IResultHttpClient，所有方法返回 Promise<Result<T>>。
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IAccountApiClient, IResultHttpClient } from '../types';
import type {
  AccountClientDTO,
  UpdateAccountReq,
  CheckAvailabilityReq,
  CheckAvailabilityRes,
  CloseAccountReq,
} from '@dailyuse/contracts/account';

export class AccountHttpAdapter implements IAccountApiClient {
  private readonly baseUrl = '/api/accounts';

  constructor(private readonly httpClient: IResultHttpClient) {}

  async getMyProfile(): Promise<Result<AccountClientDTO>> {
    return this.httpClient.get<AccountClientDTO>(`${this.baseUrl}/me`);
  }

  async updateMyProfile(request: UpdateAccountReq): Promise<Result<AccountClientDTO>> {
    return this.httpClient.put<AccountClientDTO>(`${this.baseUrl}/me`, request);
  }

  async checkAvailability(request: CheckAvailabilityReq): Promise<Result<CheckAvailabilityRes>> {
    return this.httpClient.post<CheckAvailabilityRes>(`${this.baseUrl}/availability`, request);
  }

  async closeAccount(request: CloseAccountReq): Promise<Result<void>> {
    return this.httpClient.post<void>(`${this.baseUrl}/me/close`, request);
  }
}

export function createAccountHttpAdapter(httpClient: IResultHttpClient): IAccountApiClient {
  return new AccountHttpAdapter(httpClient);
}
