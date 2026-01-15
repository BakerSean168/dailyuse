/**
 * Account HTTP Adapter
 *
 * HTTP implementation of IAccountApiClient.
 */

import type { IAccountApiClient } from '../../ports/account-api-client.port';
import type {
  AccountDTO,
  AccountListResponseDTO,
  AccountQueryParams,
  AccountStatsResponseDTO,
  AccountHistoryListResponseDTO,
  SubscriptionDTO,
  CreateAccountRequestDTO,
  UpdateAccountProfileRequestDTO,
  UpdateAccountPreferencesRequestDTO,
  UpdateEmailRequestDTO,
  VerifyEmailRequestDTO,
  UpdatePhoneRequestDTO,
  VerifyPhoneRequestDTO,
  SubscribePlanRequestDTO,
  CancelSubscriptionRequestDTO,
} from '@dailyuse/contracts/account';
import type { IHttpClient } from '../../../shared/http-client.types';
import type { ActionResult } from '@dailyuse/contracts/result';

/**
 * AccountHttpAdapter
 *
 * HTTP 实现的账户 API 客户端
 */
export class AccountHttpAdapter implements IAccountApiClient {
  private readonly baseUrl = '/accounts';

  constructor(private readonly httpClient: IHttpClient) {}

  // ===== 账户 CRUD =====

  async createAccount(request: CreateAccountRequestDTO): Promise<AccountDTO> {
    return this.httpClient.post(this.baseUrl, request);
  }

  async getAccountById(accountId: string): Promise<AccountDTO> {
    return this.httpClient.get(`${this.baseUrl}/${accountId}`);
  }

  async getAccounts(params?: AccountQueryParams): Promise<AccountListResponseDTO> {
    return this.httpClient.get(this.baseUrl, {
      params: params as unknown as Record<string, unknown>,
    });
  }

  async deleteAccount(accountId: string): Promise<void> {
    await this.httpClient.delete(`${this.baseUrl}/${accountId}`);
  }

  // ===== 当前用户资料（/me 端点）=====

  async getMyProfile(): Promise<AccountDTO> {
    return this.httpClient.get(`${this.baseUrl}/me`);
  }

  async updateMyProfile(request: UpdateAccountProfileRequestDTO): Promise<AccountDTO> {
    return this.httpClient.put(`${this.baseUrl}/me`, request);
  }

  async changeMyPassword(request: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ActionResult> {
    return this.httpClient.put(`${this.baseUrl}/me/password`, request);
  }

  // ===== 账户资料管理 =====

  async updateProfile(
    accountId: string,
    request: UpdateAccountProfileRequestDTO,
  ): Promise<AccountDTO> {
    return this.httpClient.put(`${this.baseUrl}/${accountId}/profile`, request);
  }

  async updatePreferences(
    accountId: string,
    request: UpdateAccountPreferencesRequestDTO,
  ): Promise<AccountDTO> {
    return this.httpClient.put(`${this.baseUrl}/${accountId}/preferences`, request);
  }

  // ===== 邮箱和手机号管理 =====

  async updateEmail(accountId: string, request: UpdateEmailRequestDTO): Promise<AccountDTO> {
    return this.httpClient.put(`${this.baseUrl}/${accountId}/email`, request);
  }

  async verifyEmail(accountId: string, request: VerifyEmailRequestDTO): Promise<AccountDTO> {
    return this.httpClient.post(`${this.baseUrl}/${accountId}/verify-email`, request);
  }

  async updatePhone(accountId: string, request: UpdatePhoneRequestDTO): Promise<AccountDTO> {
    return this.httpClient.put(`${this.baseUrl}/${accountId}/phone`, request);
  }

  async verifyPhone(accountId: string, request: VerifyPhoneRequestDTO): Promise<AccountDTO> {
    return this.httpClient.post(`${this.baseUrl}/${accountId}/verify-phone`, request);
  }

  // ===== 账户状态管理 =====

  async deactivateAccount(accountId: string): Promise<AccountDTO> {
    return this.httpClient.post(`${this.baseUrl}/${accountId}/deactivate`);
  }

  async suspendAccount(accountId: string): Promise<AccountDTO> {
    return this.httpClient.post(`${this.baseUrl}/${accountId}/suspend`);
  }

  async activateAccount(accountId: string): Promise<AccountDTO> {
    return this.httpClient.post(`${this.baseUrl}/${accountId}/activate`);
  }

  // ===== 订阅管理 =====

  async getSubscription(accountId: string): Promise<SubscriptionDTO> {
    return this.httpClient.get(`${this.baseUrl}/${accountId}/subscription`);
  }

  async subscribePlan(
    accountId: string,
    request: SubscribePlanRequestDTO,
  ): Promise<SubscriptionDTO> {
    return this.httpClient.post(`${this.baseUrl}/${accountId}/subscribe`, request);
  }

  async cancelSubscription(
    accountId: string,
    request?: CancelSubscriptionRequestDTO,
  ): Promise<SubscriptionDTO> {
    return this.httpClient.post(`${this.baseUrl}/${accountId}/subscription/cancel`, request);
  }

  // ===== 账户历史 =====

  async getAccountHistory(
    accountId: string,
    params?: { page?: number; limit?: number },
  ): Promise<AccountHistoryListResponseDTO> {
    return this.httpClient.get(`${this.baseUrl}/${accountId}/history`, { params });
  }

  // ===== 账户统计 =====

  async getAccountStats(): Promise<AccountStatsResponseDTO> {
    return this.httpClient.get(`${this.baseUrl}/stats`);
  }

  // ===== 向后兼容别名 =====

  /**
   * @deprecated 请使用 getMyProfile()
   */
  async getCurrentAccount(): Promise<AccountDTO> {
    return this.getMyProfile();
  }

  /**
   * @deprecated 请使用 getAccountHistory()
   */
  async getHistory(
    params?: { page?: number; limit?: number },
  ): Promise<AccountHistoryListResponseDTO> {
    return this.getAccountHistory('me', params);
  }

  /**
   * @deprecated 请使用 getAccountStats()
   */
  async getStats(_accountUuid?: string): Promise<AccountStatsResponseDTO> {
    return this.getAccountStats();
  }
}

/**
 * Factory function to create AccountHttpAdapter
 */
export function createAccountHttpAdapter(httpClient: IHttpClient): AccountHttpAdapter {
  return new AccountHttpAdapter(httpClient);
}
