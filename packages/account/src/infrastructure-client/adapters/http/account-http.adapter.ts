/**
 * Account HTTP Adapter
 *
 * HTTP implementation of IAccountApiClient.
 */

import type { IAccountApiClient, IHttpClient } from '../types';
import type {
  AccountClientDTO,
  UpdateAccountReq,
  CheckAvailabilityReq,
  CheckAvailabilityRes,
  CloseAccountReq,
} from '@dailyuse/contracts/account';

export class AccountHttpAdapter implements IAccountApiClient {
  private readonly baseUrl = '/api/accounts';

  constructor(private readonly httpClient: IHttpClient) {}

  async getMyProfile(): Promise<AccountClientDTO> {
    return this.httpClient.get(`${this.baseUrl}/me`);
  }

  async updateMyProfile(request: UpdateAccountReq): Promise<AccountClientDTO> {
    return this.httpClient.put(`${this.baseUrl}/me`, request);
  }

  async checkAvailability(request: CheckAvailabilityReq): Promise<CheckAvailabilityRes> {
    return this.httpClient.post(`${this.baseUrl}/availability`, request);
  }

  async closeAccount(request: CloseAccountReq): Promise<void> {
    await this.httpClient.post(`${this.baseUrl}/me/close`, request);
  }
}

export function createAccountHttpAdapter(httpClient: IHttpClient): IAccountApiClient {
  return new AccountHttpAdapter(httpClient);
}
