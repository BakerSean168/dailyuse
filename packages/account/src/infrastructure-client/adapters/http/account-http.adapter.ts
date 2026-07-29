/**
 * Account HTTP Adapter
 *
 * HTTP implementation of IAccountApiClient.
 * Uses IResultHttpClient — all methods return Result<T>, never throw.
 */

import type { IAccountApiClient } from '../types';
import type { IResultHttpClient } from '@memoflow/http-client';
import type { Result } from '@memoflow/contracts/result';
import type {
  AccountClientDTO,
  UpdateAccountReq,
  CheckAvailabilityReq,
  CheckAvailabilityRes,
  CloseAccountReq,
  UpdateAccountSettingsReq,
  UpdateAccountSettingsRes,
} from '@memoflow/contracts/account';

export class AccountHttpAdapter implements IAccountApiClient {
  private readonly baseUrl = '/accounts';

  constructor(private readonly httpClient: IResultHttpClient) {}

  async getMyProfile(): Promise<Result<AccountClientDTO>> {
    return this.httpClient.get(`${this.baseUrl}/me`);
  }

  async updateMyProfile(request: UpdateAccountReq): Promise<Result<AccountClientDTO>> {
    return this.httpClient.put(`${this.baseUrl}/me`, request);
  }

  async updateSettings(
    request: UpdateAccountSettingsReq,
  ): Promise<Result<UpdateAccountSettingsRes>> {
    return this.httpClient.patch(`${this.baseUrl}/me/settings`, request);
  }

  async checkAvailability(request: CheckAvailabilityReq): Promise<Result<CheckAvailabilityRes>> {
    return this.httpClient.post(`${this.baseUrl}/availability`, request);
  }

  async closeAccount(request: CloseAccountReq): Promise<Result<void>> {
    return this.httpClient.post(`${this.baseUrl}/me/close`, request);
  }
}

export function createAccountHttpAdapter(httpClient: IResultHttpClient): IAccountApiClient {
  return new AccountHttpAdapter(httpClient);
}
