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

export interface IHttpClient {
  post<T>(url: string, data?: any): Promise<T>;
  get<T>(url: string, config?: any): Promise<T>;
  put<T>(url: string, data?: any): Promise<T>;
  patch<T>(url: string, data?: any): Promise<T>;
  delete<T>(url: string): Promise<T>;
}

/**
 * Account API 客户端 - 框架无关版本
 * 负责账户相关的 API 调用
 */
export class AccountApiClient {
  private readonly baseUrl = '/accounts';

  constructor(private httpClient: IHttpClient) {}

  // ============ 账户 CRUD ============

  async createAccount(request: CreateAccountRequestDTO): Promise<AccountDTO> {
    return this.httpClient.post(this.baseUrl, request);
  }

  async getAccountById(accountId: string): Promise<AccountDTO> {
    return this.httpClient.get(`${this.baseUrl}/${accountId}`);
  }

  async getAccounts(params?: AccountQueryParams): Promise<AccountListResponseDTO> {
    return this.httpClient.get(this.baseUrl, { params });
  }

  async deleteAccount(accountId: string): Promise<void> {
    await this.httpClient.delete(`${this.baseUrl}/${accountId}`);
  }

  // ============ 当前用户资料（/me 端点）============

  async getMyProfile(): Promise<AccountDTO> {
    return this.httpClient.get(`${this.baseUrl}/me`);
  }

  async updateMyProfile(request: UpdateAccountProfileRequestDTO): Promise<AccountDTO> {
    return this.httpClient.put(`${this.baseUrl}/me`, request);
  }

  async changeMyPassword(request: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    return this.httpClient.put(`${this.baseUrl}/me/password`, request);
  }

  // ============ 账户资料管理 ============

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

  // ============ 邮箱和手机号管理 ============

  async updateEmail(
    accountId: string,
    request: UpdateEmailRequestDTO,
  ): Promise<AccountDTO> {
    return this.httpClient.put(`${this.baseUrl}/${accountId}/email`, request);
  }

  async verifyEmail(
    accountId: string,
    request: VerifyEmailRequestDTO,
  ): Promise<AccountDTO> {
    return this.httpClient.post(`${this.baseUrl}/${accountId}/verify-email`, request);
  }

  async updatePhone(
    accountId: string,
    request: UpdatePhoneRequestDTO,
  ): Promise<AccountDTO> {
    return this.httpClient.put(`${this.baseUrl}/${accountId}/phone`, request);
  }

  async verifyPhone(
    accountId: string,
    request: VerifyPhoneRequestDTO,
  ): Promise<AccountDTO> {
    return this.httpClient.post(`${this.baseUrl}/${accountId}/verify-phone`, request);
  }

  // ============ 账户状态管理 ============

  async deactivateAccount(accountId: string): Promise<AccountDTO> {
    return this.httpClient.post(`${this.baseUrl}/${accountId}/deactivate`);
  }

  async suspendAccount(accountId: string): Promise<AccountDTO> {
    return this.httpClient.post(`${this.baseUrl}/${accountId}/suspend`);
  }

  async activateAccount(accountId: string): Promise<AccountDTO> {
    return this.httpClient.post(`${this.baseUrl}/${accountId}/activate`);
  }

  // ============ 订阅管理 ============

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

  // ============ 账户历史 ============

  async getAccountHistory(
    accountId: string,
    params?: { page?: number; limit?: number },
  ): Promise<AccountHistoryListResponseDTO> {
    return this.httpClient.get(`${this.baseUrl}/${accountId}/history`, { params });
  }

  // ============ 账户统计 ============

  async getAccountStats(): Promise<AccountStatsResponseDTO> {
    return this.httpClient.get(`${this.baseUrl}/stats`);
  }
}
