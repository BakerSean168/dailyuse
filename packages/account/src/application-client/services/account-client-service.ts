/**
 * Account Client Service
 * 客户端应用服务：协调 API 调用和客户端领域模型
 *
 * 所有方法返回 Result<T>，不抛出异常。
 * 成功时将 DTO 转换为领域实体。
 */

import type { Result } from '@dailyuse/contracts/result';
import { map } from '@dailyuse/contracts/result';
import type { IAccountApiClient } from '../ports/account-api-client.port';
import type { UpdateAccountReq, CheckAvailabilityReq, CheckAvailabilityRes, CloseAccountReq } from '@dailyuse/contracts/account';
import { Account } from '../../domain-client';

export class AccountClientService {
  constructor(private readonly apiClient: IAccountApiClient) {}

  async getMyProfile(): Promise<Result<Account>> {
    const result = await this.apiClient.getMyProfile();
    return map(result, (dto) => Account.fromDTO(dto));
  }

  async updateMyProfile(request: UpdateAccountReq): Promise<Result<Account>> {
    const result = await this.apiClient.updateMyProfile(request);
    return map(result, (dto) => Account.fromDTO(dto));
  }

  async checkAvailability(request: CheckAvailabilityReq): Promise<Result<CheckAvailabilityRes>> {
    return this.apiClient.checkAvailability(request);
  }

  async closeAccount(request: CloseAccountReq): Promise<Result<void>> {
    return this.apiClient.closeAccount(request);
  }
}
