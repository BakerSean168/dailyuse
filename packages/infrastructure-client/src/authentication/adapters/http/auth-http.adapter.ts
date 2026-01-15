/**
 * Authentication HTTP Adapter
 *
 * HTTP implementation of IAuthApiClient.
 */

import type { IAuthApiClient, RegisterResponse } from '../../ports/auth-api-client.port';
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
import type { IHttpClient } from '../../../shared/http-client.types';

/**
 * AuthHttpAdapter
 *
 * HTTP 实现的认证 API 客户端
 */
export class AuthHttpAdapter implements IAuthApiClient {
  private readonly baseUrl = '/auth';

  constructor(
    private readonly httpClient: IHttpClient,
    private readonly publicHttpClient?: IHttpClient,
  ) {}

  private get publicClient(): IHttpClient {
    return this.publicHttpClient || this.httpClient;
  }

  // ===== 认证核心功能 =====

  async login(request: LoginRequest): Promise<LoginResponse> {
    return this.publicClient.post(`${this.baseUrl}/login`, request);
  }

  async register(request: RegisterRequest): Promise<RegisterResponse> {
    const response = await this.publicClient.post<{ account: unknown; message: string }>(
      `${this.baseUrl}/register`,
      request,
    );
    return {
      ok: true,
      ...response,
    };
  }

  async logout(request?: LogoutRequest): Promise<void> {
    await this.httpClient.post(`${this.baseUrl}/logout`, request);
  }

  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    return this.httpClient.post(`${this.baseUrl}/refresh-token`, request);
  }

  // ===== 密码管理 =====

  async forgotPassword(request: ForgotPasswordRequest): Promise<void> {
    await this.publicClient.post(`${this.baseUrl}/forgot-password`, request);
  }

  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    await this.publicClient.post(`${this.baseUrl}/reset-password`, request);
  }

  async changePassword(request: ChangePasswordRequest): Promise<void> {
    await this.httpClient.post(`${this.baseUrl}/change-password`, request);
  }

  // ===== 两步验证 =====

  async enable2FA(request: Enable2FARequest): Promise<Enable2FAResponse> {
    return this.httpClient.post(`${this.baseUrl}/2fa/enable`, request);
  }

  async disable2FA(request: Disable2FARequest): Promise<void> {
    await this.httpClient.post(`${this.baseUrl}/2fa/disable`, request);
  }

  async verify2FA(request: Verify2FARequest): Promise<void> {
    await this.httpClient.post(`${this.baseUrl}/2fa/verify`, request);
  }

  // ===== API Key 管理 =====

  async createApiKey(request: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
    return this.httpClient.post(`${this.baseUrl}/api-keys`, request);
  }

  async getApiKeys(): Promise<ApiKeyListResponse> {
    return this.httpClient.get(`${this.baseUrl}/api-keys`);
  }

  async revokeApiKey(request: RevokeApiKeyRequest): Promise<void> {
    await this.httpClient.delete(`${this.baseUrl}/api-keys/${request.apiKeyId}`);
  }

  // ===== 会话管理 =====

  async getActiveSessions(request?: GetActiveSessionsRequest): Promise<ActiveSessionsResponse> {
    return this.httpClient.get(`${this.baseUrl}/sessions`, {
      params: request as unknown as Record<string, unknown>,
    });
  }

  async revokeSession(request: RevokeSessionRequest): Promise<void> {
    await this.httpClient.delete(`${this.baseUrl}/sessions/${request.sessionId}`);
  }

  async revokeAllSessions(request?: RevokeAllSessionsRequest): Promise<void> {
    await this.httpClient.post(`${this.baseUrl}/sessions/revoke-all`, request);
  }

  // ===== 设备管理 =====

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

/**
 * Factory function to create AuthHttpAdapter
 */
export function createAuthHttpAdapter(
  httpClient: IHttpClient,
  publicHttpClient?: IHttpClient,
): AuthHttpAdapter {
  return new AuthHttpAdapter(httpClient, publicHttpClient);
}
