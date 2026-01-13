/**
 * Authentication API Client Port Interface
 *
 * 定义认证模块的 API 客户端接口。
 * 包含登录、注册、令牌刷新、2FA、会话管理等功能。
 */

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

/**
 * 注册响应
 */
export interface RegisterResponse {
  success: boolean;
  account?: unknown;
  message?: string;
}

/**
 * IAuthApiClient
 *
 * 认证模块 API 客户端接口
 */
export interface IAuthApiClient {
  // ===== 认证核心功能 =====

  /**
   * 登录
   */
  login(request: LoginRequest): Promise<LoginResponse>;

  /**
   * 注册
   */
  register(request: RegisterRequest): Promise<RegisterResponse>;

  /**
   * 登出
   */
  logout(request?: LogoutRequest): Promise<void>;

  /**
   * 刷新令牌
   */
  refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse>;

  // ===== 密码管理 =====

  /**
   * 忘记密码（发送重置邮件）
   */
  forgotPassword(request: ForgotPasswordRequest): Promise<void>;

  /**
   * 重置密码
   */
  resetPassword(request: ResetPasswordRequest): Promise<void>;

  /**
   * 修改密码
   */
  changePassword(request: ChangePasswordRequest): Promise<void>;

  // ===== 两步验证 =====

  /**
   * 启用两步验证
   */
  enable2FA(request: Enable2FARequest): Promise<Enable2FAResponse>;

  /**
   * 禁用两步验证
   */
  disable2FA(request: Disable2FARequest): Promise<void>;

  /**
   * 验证两步验证码
   */
  verify2FA(request: Verify2FARequest): Promise<void>;

  // ===== API Key 管理 =====

  /**
   * 创建 API Key
   */
  createApiKey(request: CreateApiKeyRequest): Promise<CreateApiKeyResponse>;

  /**
   * 获取 API Key 列表
   */
  getApiKeys(): Promise<ApiKeyListResponse>;

  /**
   * 撤销 API Key
   */
  revokeApiKey(request: RevokeApiKeyRequest): Promise<void>;

  // ===== 会话管理 =====

  /**
   * 获取活跃会话列表
   */
  getActiveSessions(request?: GetActiveSessionsRequest): Promise<ActiveSessionsResponse>;

  /**
   * 撤销会话
   */
  revokeSession(request: RevokeSessionRequest): Promise<void>;

  /**
   * 撤销所有会话
   */
  revokeAllSessions(request?: RevokeAllSessionsRequest): Promise<void>;

  // ===== 设备管理 =====

  /**
   * 信任设备
   */
  trustDevice(request: TrustDeviceRequest): Promise<void>;

  /**
   * 撤销设备信任
   */
  revokeTrustedDevice(request: RevokeTrustedDeviceRequest): Promise<void>;

  /**
   * 获取受信任设备列表
   */
  getTrustedDevices(): Promise<TrustedDevicesResponse>;
}
