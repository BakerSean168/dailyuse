import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  LogoutRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  Enable2FARequest,
  Enable2FAResponse,
  Disable2FARequest,
  Verify2FARequest,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  ApiKeyListResponse,
  RevokeApiKeyRequest,
  GetActiveSessionsRequest,
  ActiveSessionsResponse,
  RevokeSessionRequest,
  RevokeAllSessionsRequest,
  TrustDeviceRequest,
  RevokeTrustedDeviceRequest,
  TrustedDevicesResponse,
} from '@dailyuse/contracts/authentication';

export interface IHttpClient {
  post<T>(url: string, data?: any): Promise<T>;
  get<T>(url: string, config?: any): Promise<T>;
  delete<T>(url: string): Promise<T>;
}

export interface IPublicHttpClient {
  post<T>(url: string, data?: any): Promise<T>;
  postWithMessage?(url: string, data?: any): Promise<{ data: any; message: string }>;
}

/**
 * Authentication API 客户端 - 框架无关版本
 * 负责认证相关的 API 调用
 */
export class AuthApiClient {
  private readonly baseUrl = '/auth';

  constructor(
    private httpClient: IHttpClient,
    private publicHttpClient: IPublicHttpClient,
  ) {}

  // ============ 认证核心功能 ============

  async login(request: LoginRequest): Promise<LoginResponse> {
    return this.publicHttpClient.post(`${this.baseUrl}/login`, request);
  }

  async register(
    request: RegisterRequest,
  ): Promise<{ account: any; message: string }> {
    const postWithMessage = this.publicHttpClient.postWithMessage;
    if (postWithMessage) {
      const response = await postWithMessage(`${this.baseUrl}/register`, request);
      return {
        account: response.data.account,
        message: response.message,
      };
    }
    const data = await this.publicHttpClient.post(`${this.baseUrl}/register`, request);
    return {
      account: data.account,
      message: '',
    };
  }

  async logout(request?: LogoutRequest): Promise<void> {
    await this.httpClient.post(`${this.baseUrl}/logout`, request);
  }

  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    return this.httpClient.post(`${this.baseUrl}/refresh-token`, request);
  }

  // ============ 密码管理 ============

  async forgotPassword(request: ForgotPasswordRequest): Promise<void> {
    await this.publicHttpClient.post(`${this.baseUrl}/forgot-password`, request);
  }

  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    await this.publicHttpClient.post(`${this.baseUrl}/reset-password`, request);
  }

  async changePassword(request: ChangePasswordRequest): Promise<void> {
    await this.httpClient.post(`${this.baseUrl}/change-password`, request);
  }

  // ============ 两步验证 ============

  async enable2FA(request: Enable2FARequest): Promise<Enable2FAResponse> {
    return this.httpClient.post(`${this.baseUrl}/2fa/enable`, request);
  }

  async disable2FA(request: Disable2FARequest): Promise<void> {
    await this.httpClient.post(`${this.baseUrl}/2fa/disable`, request);
  }

  async verify2FA(request: Verify2FARequest): Promise<void> {
    await this.httpClient.post(`${this.baseUrl}/2fa/verify`, request);
  }

  // ============ API Key 管理 ============

  async createApiKey(request: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
    return this.httpClient.post(`${this.baseUrl}/api-keys`, request);
  }

  async getApiKeys(): Promise<ApiKeyListResponse> {
    return this.httpClient.get(`${this.baseUrl}/api-keys`);
  }

  async revokeApiKey(request: RevokeApiKeyRequest): Promise<void> {
    await this.httpClient.delete(`${this.baseUrl}/api-keys/${request.apiKeyId}`);
  }

  // ============ 会话管理 ============

  async getActiveSessions(request?: GetActiveSessionsRequest): Promise<ActiveSessionsResponse> {
    return this.httpClient.get(`${this.baseUrl}/sessions`, { params: request });
  }

  async revokeSession(request: RevokeSessionRequest): Promise<void> {
    await this.httpClient.delete(`${this.baseUrl}/sessions/${request.sessionId}`);
  }

  async revokeAllSessions(request?: RevokeAllSessionsRequest): Promise<void> {
    await this.httpClient.post(`${this.baseUrl}/sessions/revoke-all`, request);
  }

  // ============ 设备管理 ============

  async trustDevice(request: TrustDeviceRequest): Promise<void> {
    await this.httpClient.post(`${this.baseUrl}/devices/trust`, request);
  }

  async revokeTrustedDevice(request: RevokeTrustedDeviceRequest): Promise<void> {
    await this.httpClient.delete(`${this.baseUrl}/devices/${request.deviceId}`);
  }

  async getTrustedDevices(): Promise<TrustedDevicesResponse> {
    return this.httpClient.get(`${this.baseUrl}/devices/trusted`);
  }
}
