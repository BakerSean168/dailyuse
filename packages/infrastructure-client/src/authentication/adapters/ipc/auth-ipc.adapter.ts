/**
 * Authentication IPC Adapter
 *
 * IPC implementation of IAuthApiClient for Electron desktop apps.
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

/**
 * IPC channel definitions for Authentication operations
 */
const AUTH_CHANNELS = {
  // Core Auth
  LOGIN: 'auth:login',
  REGISTER: 'auth:register',
  LOGOUT: 'auth:logout',
  REFRESH_TOKEN: 'auth:refresh-token',
  // Password
  FORGOT_PASSWORD: 'auth:forgot-password',
  RESET_PASSWORD: 'auth:reset-password',
  CHANGE_PASSWORD: 'auth:change-password',
  // 2FA
  ENABLE_2FA: 'auth:2fa:enable',
  DISABLE_2FA: 'auth:2fa:disable',
  VERIFY_2FA: 'auth:2fa:verify',
  // API Keys
  CREATE_API_KEY: 'auth:api-key:create',
  GET_API_KEYS: 'auth:api-key:list',
  REVOKE_API_KEY: 'auth:api-key:revoke',
  // Sessions
  GET_SESSIONS: 'auth:session:list',
  REVOKE_SESSION: 'auth:session:revoke',
  REVOKE_ALL_SESSIONS: 'auth:session:revoke-all',
  // Devices
  TRUST_DEVICE: 'auth:device:trust',
  REVOKE_DEVICE: 'auth:device:revoke',
  GET_TRUSTED_DEVICES: 'auth:device:list',
} as const;

/**
 * IPC API interface for Electron renderer process
 */
interface IpcApi {
  invoke<T>(channel: string, ...args: unknown[]): Promise<T>;
}

/**
 * AuthIpcAdapter
 *
 * IPC 实现的认证 API 客户端（用于 Electron 桌面应用）
 */
export class AuthIpcAdapter implements IAuthApiClient {
  constructor(private readonly ipcApi: IpcApi) {}

  // ===== 认证核心功能 =====

  async login(request: LoginRequest): Promise<LoginResponse> {
    return this.ipcApi.invoke(AUTH_CHANNELS.LOGIN, request);
  }

  async register(request: RegisterRequest): Promise<RegisterResponse> {
    return this.ipcApi.invoke(AUTH_CHANNELS.REGISTER, request);
  }

  async logout(request?: LogoutRequest): Promise<void> {
    await this.ipcApi.invoke(AUTH_CHANNELS.LOGOUT, request);
  }

  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    return this.ipcApi.invoke(AUTH_CHANNELS.REFRESH_TOKEN, request);
  }

  // ===== 密码管理 =====

  async forgotPassword(request: ForgotPasswordRequest): Promise<void> {
    await this.ipcApi.invoke(AUTH_CHANNELS.FORGOT_PASSWORD, request);
  }

  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    await this.ipcApi.invoke(AUTH_CHANNELS.RESET_PASSWORD, request);
  }

  async changePassword(request: ChangePasswordRequest): Promise<void> {
    await this.ipcApi.invoke(AUTH_CHANNELS.CHANGE_PASSWORD, request);
  }

  // ===== 两步验证 =====

  async enable2FA(request: Enable2FARequest): Promise<Enable2FAResponse> {
    return this.ipcApi.invoke(AUTH_CHANNELS.ENABLE_2FA, request);
  }

  async disable2FA(request: Disable2FARequest): Promise<void> {
    await this.ipcApi.invoke(AUTH_CHANNELS.DISABLE_2FA, request);
  }

  async verify2FA(request: Verify2FARequest): Promise<void> {
    await this.ipcApi.invoke(AUTH_CHANNELS.VERIFY_2FA, request);
  }

  // ===== API Key 管理 =====

  async createApiKey(request: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
    return this.ipcApi.invoke(AUTH_CHANNELS.CREATE_API_KEY, request);
  }

  async getApiKeys(): Promise<ApiKeyListResponse> {
    return this.ipcApi.invoke(AUTH_CHANNELS.GET_API_KEYS);
  }

  async revokeApiKey(request: RevokeApiKeyRequest): Promise<void> {
    await this.ipcApi.invoke(AUTH_CHANNELS.REVOKE_API_KEY, request);
  }

  // ===== 会话管理 =====

  async getActiveSessions(request?: GetActiveSessionsRequest): Promise<ActiveSessionsResponse> {
    return this.ipcApi.invoke(AUTH_CHANNELS.GET_SESSIONS, request);
  }

  async revokeSession(request: RevokeSessionRequest): Promise<void> {
    await this.ipcApi.invoke(AUTH_CHANNELS.REVOKE_SESSION, request);
  }

  async revokeAllSessions(request?: RevokeAllSessionsRequest): Promise<void> {
    await this.ipcApi.invoke(AUTH_CHANNELS.REVOKE_ALL_SESSIONS, request);
  }

  // ===== 设备管理 =====

  async trustDevice(request: TrustDeviceRequest): Promise<void> {
    await this.ipcApi.invoke(AUTH_CHANNELS.TRUST_DEVICE, request);
  }

  async revokeTrustedDevice(request: RevokeTrustedDeviceRequest): Promise<void> {
    await this.ipcApi.invoke(AUTH_CHANNELS.REVOKE_DEVICE, request);
  }

  async getTrustedDevices(): Promise<TrustedDevicesResponse> {
    return this.ipcApi.invoke(AUTH_CHANNELS.GET_TRUSTED_DEVICES);
  }
}

/**
 * Factory function to create AuthIpcAdapter
 */
export function createAuthIpcAdapter(ipcApi: IpcApi): AuthIpcAdapter {
  return new AuthIpcAdapter(ipcApi);
}
