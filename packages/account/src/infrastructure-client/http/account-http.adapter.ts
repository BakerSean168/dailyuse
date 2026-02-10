/**
 * Account HTTP Adapter
 *
 * HTTP implementation of IAccountApiClient.
 */

import type { IAccountApiClient } from '../../application-client';
import type {
  AccountClientDTO,
  UpdateAccountReq,
  CheckAvailabilityReq,
  CheckAvailabilityRes,
  CloseAccountReq,
} from '@dailyuse/contracts/account';

export interface HttpClient {
  get<T = any>(url: string, config?: { params?: any }): Promise<T>;
  post<T = any>(url: string, data?: any): Promise<T>;
  put<T = any>(url: string, data?: any): Promise<T>;
  delete<T = any>(url: string): Promise<T>;
}

export class AccountHttpAdapter implements IAccountApiClient {
  private readonly baseUrl = '/api/accounts';

  constructor(private readonly httpClient: HttpClient) {}

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

export function createAccountHttpAdapter(httpClient: HttpClient): IAccountApiClient {
  return new AccountHttpAdapter(httpClient);
}
