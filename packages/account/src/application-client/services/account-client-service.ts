/**
 * Account Client Service
 * 客户端应用服�?�?协调 API 调用和客户端领域模型
 */

import type { IAccountApiClient } from '../ports/account-api-client.port';
import type { AccountClientDTO, UpdateAccountReq, CheckAvailabilityReq, CheckAvailabilityRes, CloseAccountReq } from '@dailyuse/contracts/account';
import { Account } from '../../domain-client';

export class AccountClientService {
  constructor(private readonly apiClient: IAccountApiClient) {}

  async getMyProfile(): Promise<Account> {
    const dto = await this.apiClient.getMyProfile();
    return Account.fromDTO(dto);
  }

  async updateMyProfile(request: UpdateAccountReq): Promise<Account> {
    const dto = await this.apiClient.updateMyProfile(request);
    return Account.fromDTO(dto);
  }

  async checkAvailability(request: CheckAvailabilityReq): Promise<CheckAvailabilityRes> {
    return this.apiClient.checkAvailability(request);
  }

  async closeAccount(request: CloseAccountReq): Promise<void> {
    return this.apiClient.closeAccount(request);
  }
}
