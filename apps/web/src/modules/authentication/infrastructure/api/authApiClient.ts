import { apiClient, publicApiClient } from '@/shared/api/instances';
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

// Type aliases for backward compatibility
type LoginRequestDTO = LoginRequest;
type LoginResponseDTO = LoginResponse;
type RegisterRequestDTO = RegisterRequest;
type LogoutRequestDTO = LogoutRequest;
type RefreshTokenRequestDTO = RefreshTokenRequest;
type RefreshTokenResponseDTO = RefreshTokenResponse;
type ForgotPasswordRequestDTO = ForgotPasswordRequest;
type ResetPasswordRequestDTO = ResetPasswordRequest;
type ChangePasswordRequestDTO = ChangePasswordRequest;
type Enable2FARequestDTO = Enable2FARequest;
type Enable2FAResponseDTO = Enable2FAResponse;
type Disable2FARequestDTO = Disable2FARequest;
type Verify2FARequestDTO = Verify2FARequest;
type CreateApiKeyRequestDTO = CreateApiKeyRequest;
type CreateApiKeyResponseDTO = CreateApiKeyResponse;
type ApiKeyListResponseDTO = ApiKeyListResponse;
type RevokeApiKeyRequestDTO = RevokeApiKeyRequest;
type GetActiveSessionsRequestDTO = GetActiveSessionsRequest;
type ActiveSessionsResponseDTO = ActiveSessionsResponse;
type RevokeSessionRequestDTO = RevokeSessionRequest;
type RevokeAllSessionsRequestDTO = RevokeAllSessionsRequest;
type TrustDeviceRequestDTO = TrustDeviceRequest;
type TrustedDevicesResponseDTO = TrustedDevicesResponse;
type RevokeTrustedDeviceRequestDTO = RevokeTrustedDeviceRequest;

/**
 * Authentication API 客户端
 * 负责认证相关的 API 调用
 *
 * API 路由设计:
 * - POST   /auth/login                  - 登录 (公开)
 * - POST   /auth/register               - 注册 (公开)
 * - POST   /auth/logout                 - 登出 (需要认证)
 * - POST   /auth/refresh-token          - 刷新令牌
 * - POST   /auth/forgot-password        - 忘记密码 (公开)
 * - POST   /auth/reset-password         - 重置密码 (公开)
 * - POST   /auth/change-password        - 修改密码 (需要认证)
 * - POST   /auth/2fa/enable             - 启用两步验证 (需要认证)
 * - POST   /auth/2fa/disable            - 禁用两步验证 (需要认证)
 * - POST   /auth/2fa/verify             - 验证两步验证码
 * - POST   /auth/api-keys               - 创建 API Key (需要认证)
 * - GET    /auth/api-keys               - 获取 API Key 列表 (需要认证)
 * - DELETE /auth/api-keys/:id           - 撤销 API Key (需要认证)
 * - GET    /auth/sessions               - 获取活跃会话列表 (需要认证)
 * - DELETE /auth/sessions/:id           - 撤销会话 (需要认证)
 * - DELETE /auth/sessions               - 撤销所有会话 (需要认证)
 * - POST   /auth/devices/trust          - 信任设备 (需要认证)
 * - DELETE /auth/devices/:id            - 撤销设备信任 (需要认证)
 * - GET    /auth/devices/trusted        - 获取受信任设备列表 (需要认证)
 */
export class AuthApiClient {
  private readonly baseUrl = '/auth';

  // ============ 认证核心功能 ============

  /**
   * 登录 (公开接口，不需要认证)
   */
  async login(
    request: LoginRequestDTO,
  ): Promise<LoginResponseDTO> {
    const data = await publicApiClient.post(`${this.baseUrl}/login`, request);
    return data;
  }

  /**
   * 注册 (公开接口，不需要认证)
   * 
   * ⚠️ 注意：使用 postWithMessage 保留后端返回的 message
   * 因为注册接口返回的 message 包含重要提示信息
   */
  async register(
    request: RegisterRequestDTO,
  ): Promise<{ account: any; message: string }> {
    const response = await publicApiClient.postWithMessage(`${this.baseUrl}/register`, request);
    return {
      account: response.data.account,
      message: response.message,
    };
  }

  /**
   * 登出
   */
  async logout(request?: LogoutRequestDTO): Promise<void> {
    await apiClient.post(`${this.baseUrl}/logout`, request);
  }

  /**
   * 刷新令牌
   */
  async refreshToken(
    request: RefreshTokenRequestDTO,
  ): Promise<RefreshTokenResponseDTO> {
    const data = await apiClient.post(`${this.baseUrl}/refresh-token`, request);
    return data;
  }

  // ============ 密码管理 ============

  /**
   * 忘记密码（发送重置邮件）(公开接口，不需要认证)
   */
  async forgotPassword(request: ForgotPasswordRequestDTO): Promise<void> {
    await publicApiClient.post(`${this.baseUrl}/forgot-password`, request);
  }

  /**
   * 重置密码 (公开接口，不需要认证)
   */
  async resetPassword(request: ResetPasswordRequestDTO): Promise<void> {
    await publicApiClient.post(`${this.baseUrl}/reset-password`, request);
  }

  /**
   * 修改密码
   */
  async changePassword(request: ChangePasswordRequestDTO): Promise<void> {
    await apiClient.post(`${this.baseUrl}/change-password`, request);
  }

  // ============ 两步验证 ============

  /**
   * 启用两步验证
   */
  async enable2FA(
    request: Enable2FARequestDTO,
  ): Promise<Enable2FAResponseDTO> {
    const data = await apiClient.post(`${this.baseUrl}/2fa/enable`, request);
    return data;
  }

  /**
   * 禁用两步验证
   */
  async disable2FA(request: Disable2FARequestDTO): Promise<void> {
    await apiClient.post(`${this.baseUrl}/2fa/disable`, request);
  }

  /**
   * 验证两步验证码
   */
  async verify2FA(request: Verify2FARequestDTO): Promise<void> {
    await apiClient.post(`${this.baseUrl}/2fa/verify`, request);
  }

  // ============ API Key 管理 ============

  /**
   * 创建 API Key
   */
  async createApiKey(
    request: CreateApiKeyRequestDTO,
  ): Promise<CreateApiKeyResponseDTO> {
    const data = await apiClient.post(`${this.baseUrl}/api-keys`, request);
    return data;
  }

  /**
   * 获取 API Key 列表
   */
  async getApiKeys(): Promise<ApiKeyListResponseDTO> {
    const data = await apiClient.get(`${this.baseUrl}/api-keys`);
    return data;
  }

  /**
   * 撤销 API Key
   */
  async revokeApiKey(request: RevokeApiKeyRequestDTO): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/api-keys/${request.apiKeyId}`);
  }

  // ============ 会话管理 ============

  /**
   * 获取活跃会话列表
   */
  async getActiveSessions(
    request?: GetActiveSessionsRequestDTO,
  ): Promise<ActiveSessionsResponseDTO> {
    const data = await apiClient.get(`${this.baseUrl}/sessions`, { params: request });
    return data;
  }

  /**
   * 撤销会话
   */
  async revokeSession(request: RevokeSessionRequestDTO): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/sessions/${request.sessionId}`);
  }

  /**
   * 撤销所有会话
   */
  async revokeAllSessions(
    request?: RevokeAllSessionsRequestDTO,
  ): Promise<void> {
    await apiClient.post(`${this.baseUrl}/sessions/revoke-all`, request);
  }

  // ============ 设备管理 ============

  /**
   * 信任设备
   */
  async trustDevice(request: TrustDeviceRequestDTO): Promise<void> {
    await apiClient.post(`${this.baseUrl}/devices/trust`, request);
  }

  /**
   * 撤销设备信任
   */
  async revokeTrustedDevice(
    request: RevokeTrustedDeviceRequestDTO,
  ): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/devices/${request.deviceId}`);
  }

  /**
   * 获取受信任设备列表
   */
  async getTrustedDevices(): Promise<TrustedDevicesResponseDTO> {
    const data = await apiClient.get(`${this.baseUrl}/devices/trusted`);
    return data;
  }
}

// 导出单例
export const authApiClient = new AuthApiClient();

