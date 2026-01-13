/**
 * Authentication Module API Request/Response DTOs
 * 认证模块 API 请求响应数据传输对象
 */

import { DeviceType, SessionStatus, CredentialType, TwoFactorMethod } from './enums';

// ============ Token Types ============

/**
 * 认证 Token 数据
 * 用于前端存储和管理认证状态
 */
export interface AuthTokens {
  /** 访问令牌 */
  accessToken: string;
  /** 刷新令牌（可选 - 现在存储在 httpOnly Cookie 中） */
  refreshToken?: string;
  /** 访问令牌过期时间戳 (ms) */
  accessTokenExpiresAt?: number;
  /** 刷新令牌过期时间戳 (ms) */
  refreshTokenExpiresAt?: number;
  /** 令牌类型（默认 Bearer） */
  tokenType?: string;
}

// ============ 认证请求 ============

/**
 * 登录请求
 */
export interface LoginRequest {
  /** 用户名或邮箱 */
  identifier: string;
  /** 密码 */
  password: string;
  /** 记住登录 */
  rememberMe?: boolean;
  /** 设备信息 */
  deviceInfo?: {
    deviceId?: string;
    deviceName?: string;
    deviceType?: DeviceType;
    os?: string;
    browser?: string;
    ipAddress?: string;
  };
}

/**
 * 登录响应
 */
export interface LoginResponse {
  /** 操作是否成功 */
  success: boolean;
  /** 访问令牌 */
  accessToken?: string;
  /** 刷新令牌 */
  refreshToken?: string;
  /** 访问令牌过期时间戳 (ms) */
  accessTokenExpiresAt?: number;
  /** 刷新令牌过期时间戳 (ms) */
  refreshTokenExpiresAt?: number;
  /** 过期时间（秒） */
  expiresIn?: number;
  /** 会话 ID */
  sessionId?: string;
  /** 账户 UUID */
  accountUuid?: string;
  /** 是否需要两步验证 */
  requiresTwoFactor?: boolean;
  /** 错误信息 */
  error?: string;
}

/**
 * 注册请求
 */
export interface RegisterRequest {
  /** 用户名 */
  username: string;
  /** 邮箱 */
  email: string;
  /** 密码 */
  password: string;
  /** 确认密码 */
  confirmPassword: string;
  /** 设备信息 */
  deviceInfo?: {
    deviceId?: string;
    deviceName?: string;
    deviceType?: DeviceType;
    os?: string;
    browser?: string;
    ipAddress?: string;
  };
}

/**
 * 刷新令牌请求
 */
export interface RefreshTokenRequest {
  /** 刷新令牌 */
  refreshToken: string;
}

/**
 * 刷新令牌响应
 */
export interface RefreshTokenResponse {
  /** 新访问令牌 */
  accessToken: string;
  /** 新刷新令牌（已废弃 - 现在通过 httpOnly Cookie 自动更新） */
  refreshToken?: string;
  /** 访问令牌过期时间戳 (ms) */
  accessTokenExpiresAt: number;
  /** 刷新令牌过期时间戳 (ms)（已废弃 - Refresh Token 现在存储在 Cookie 中） */
  refreshTokenExpiresAt?: number;
}

/**
 * 登出请求
 */
export interface LogoutRequest {
  /** 会话 ID (可选，如果不提供则登出当前会话) */
  sessionId?: string;
  /** 是否登出所有会话 */
  allSessions?: boolean;
}

/**
 * 修改密码请求
 */
export interface ChangePasswordRequest {
  /** 旧密码 */
  oldPassword: string;
  /** 新密码 */
  newPassword: string;
  /** 确认新密码 */
  confirmPassword: string;
}

/**
 * 重置密码请求
 */
export interface ResetPasswordRequest {
  /** 重置令牌 */
  token: string;
  /** 新密码 */
  newPassword: string;
  /** 确认新密码 */
  confirmPassword: string;
}

/**
 * 忘记密码请求
 */
export interface ForgotPasswordRequest {
  /** 邮箱 */
  email: string;
}

// ============ 两步验证请求 ============

/**
 * 启用两步验证请求
 */
export interface Enable2FARequest {
  /** 两步验证方法 */
  method: TwoFactorMethod;
  /** 密码确认 */
  password: string;
}

/**
 * 启用两步验证响应
 */
export interface Enable2FAResponse {
  /** 密钥 (用于 TOTP) */
  secret?: string;
  /** 二维码 URL (用于 TOTP) */
  qrCodeUrl?: string;
  /** 备份码列表 */
  backupCodes?: string[];
}

/**
 * 验证两步验证码请求
 */
export interface Verify2FARequest {
  /** 验证码 */
  code: string;
  /** 会话 ID */
  sessionId?: string;
}

/**
 * 禁用两步验证请求
 */
export interface Disable2FARequest {
  /** 密码确认 */
  password: string;
  /** 验证码 */
  code: string;
}

// ============ API Key 请求 ============

/**
 * 创建 API Key 请求
 */
export interface CreateApiKeyRequest {
  /** API Key 名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 过期时间戳 (ms, 可选) */
  expiresAt?: number;
  /** 作用域 */
  scopes?: string[];
}

/**
 * 创建 API Key 响应
 */
export interface CreateApiKeyResponse {
  /** API Key ID */
  id: string;
  /** API Key (明文, 只返回一次) */
  key: string;
  /** API Key 名称 */
  name: string;
  /** 创建时间戳 (ms) */
  createdAt: number;
  /** 过期时间戳 (ms) */
  expiresAt?: number;
}

/**
 * 撤销 API Key 请求
 */
export interface RevokeApiKeyRequest {
  /** API Key ID */
  apiKeyId: string;
}

/**
 * API Key 列表响应
 */
export interface ApiKeyListResponse {
  keys: Array<{
    id: string;
    name: string;
    description?: string;
    keyPrefix: string; // 只返回前缀如 "sk_..."
    createdAt: number;
    expiresAt?: number;
    lastUsedAt?: number;
  }>;
}

// ============ 会话管理请求 ============

/**
 * 获取活跃会话请求
 */
export interface GetActiveSessionsRequest {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
}

/**
 * 活跃会话响应
 */
export interface ActiveSessionsResponse {
  sessions: Array<{
    id: string;
    deviceName?: string;
    deviceType?: DeviceType;
    os?: string;
    browser?: string;
    ipAddress?: string;
    location?: string;
    createdAt: number;
    lastActivityAt: number;
    isCurrent: boolean;
  }>;
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 撤销会话请求
 */
export interface RevokeSessionRequest {
  /** 会话 ID */
  sessionId: string;
}

/**
 * 撤销所有会话请求（除当前会话外）
 */
export interface RevokeAllSessionsRequest {
  /** 是否包含当前会话 */
  includeCurrent?: boolean;
}

// ============ 设备管理请求 ============

/**
 * 信任设备请求
 */
export interface TrustDeviceRequest {
  /** 设备 ID */
  deviceId: string;
  /** 设备名称 */
  deviceName?: string;
}

/**
 * 撤销设备信任请求
 */
export interface RevokeTrustedDeviceRequest {
  /** 设备 ID */
  deviceId: string;
}

/**
 * 受信任设备列表响应
 */
export interface TrustedDevicesResponse {
  devices: Array<{
    deviceId: string;
    deviceName?: string;
    deviceType?: DeviceType;
    os?: string;
    browser?: string;
    trustedAt: number;
    lastUsedAt?: number;
  }>;
}

// ============ 查询参数 ============

/**
 * 会话查询参数
 */
export interface SessionQueryParams {
  /** 账户 ID */
  accountId?: string;
  /** 会话状态 */
  status?: SessionStatus;
  /** 设备类型 */
  deviceType?: DeviceType;
  /** 开始时间戳 (ms) */
  startDate?: number;
  /** 结束时间戳 (ms) */
  endDate?: number;
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
}

/**
 * 凭证查询参数
 */
export interface CredentialQueryParams {
  /** 账户 ID */
  accountId?: string;
  /** 凭证类型 */
  type?: CredentialType;
  /** 是否启用 */
  enabled?: boolean;
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
}

// ============ Token 管理类型（多端通用） ============

/**
 * Token 存储数据
 * 用于本地持久化存储的 Token 完整信息
 */
export interface TokenStorageData {
  /** Access Token */
  accessToken: string;
  /** Refresh Token */
  refreshToken: string;
  /** Access Token 过期时间戳 (ms) */
  accessTokenExpiresAt: number;
  /** Refresh Token 过期时间戳 (ms) */
  refreshTokenExpiresAt: number;
  /** 关联的账户 UUID */
  accountUuid: string;
  /** 关联的会话 UUID */
  sessionUuid: string;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
}

/**
 * Token 保存请求
 */
export interface SaveTokenRequest {
  accessToken: string;
  refreshToken: string;
  /** Access Token 有效期（秒） */
  accessTokenExpiresIn: number;
  /** Refresh Token 有效期（秒），默认 30 天 */
  refreshTokenExpiresIn?: number;
  accountUuid: string;
  sessionUuid: string;
}

/**
 * Token 刷新结果
 */
export interface TokenRefreshResult {
  success: boolean;
  accessToken?: string;
  expiresAt?: number;
  error?: string;
}

/**
 * Token 状态
 */
export interface TokenStatus {
  /** 是否有有效的 Token（Refresh Token 未过期） */
  hasValidToken: boolean;
  /** Access Token 是否过期 */
  isAccessTokenExpired: boolean;
  /** Refresh Token 是否过期 */
  isRefreshTokenExpired: boolean;
  /** 是否需要刷新（提前 10 分钟） */
  shouldRefresh: boolean;
  /** Access Token 剩余时间（毫秒） */
  accessTokenRemainingMs: number;
  /** Refresh Token 剩余时间（毫秒） */
  refreshTokenRemainingMs: number;
  /** 账户 UUID */
  accountUuid?: string;
  /** 会话 UUID */
  sessionUuid?: string;
}

// ============ 会话管理类型（多端通用） ============

/**
 * 会话恢复结果
 */
export interface SessionRestoreResult {
  success: boolean;
  /** 恢复的会话 UUID */
  sessionUuid?: string;
  /** 账户 UUID */
  accountUuid?: string;
  /** 是否需要刷新 Token */
  needsRefresh?: boolean;
  /** 是否需要重新登录 */
  needsReLogin?: boolean;
  error?: string;
}

/**
 * 自动登录结果
 */
export interface AutoLoginResult {
  success: boolean;
  /** 是否已认证 */
  authenticated: boolean;
  /** 账户 UUID */
  accountUuid?: string;
  /** 会话 UUID */
  sessionUuid?: string;
  /** 是否是新创建的会话 */
  isNewSession?: boolean;
  error?: string;
}

/**
 * 认证模式
 */
export type AuthMode = 'ONLINE' | 'OFFLINE' | 'LOCAL';

/**
 * 认证状态
 */
export interface AuthStatusDTO {
  /** 是否已认证 */
  authenticated: boolean;
  /** 认证模式 */
  mode: AuthMode;
  /** 用户信息 */
  user: {
    uuid: string;
    username?: string;
    email?: string;
    displayName?: string;
  } | null;
  /** 会话信息 */
  session: {
    uuid: string;
    deviceName: string;
    deviceType: string;
    ipAddress: string;
    createdAt: string;
    lastActiveAt: string;
    expiresAt: string;
    isCurrentSession: boolean;
  } | null;
  /** Token 状态 */
  tokenStatus: TokenStatus | null;
}

/**
 * 会话状态（详细）
 */
export interface SessionStatusDTO {
  /** 是否有活跃会话 */
  hasActiveSession: boolean;
  /** 当前会话 UUID */
  sessionUuid?: string;
  /** 关联账户 UUID */
  accountUuid?: string;
  /** Token 状态 */
  tokenStatus: TokenStatus;
  /** 设备信息 */
  device: {
    deviceId: string;
    deviceType: DeviceType;
    os: string;
    osVersion: string;
    appVersion: string;
    deviceName: string;
    deviceFingerprint: string;
  };
  /** 最后活动时间 */
  lastActivityAt?: number;
  /** 会话创建时间 */
  sessionCreatedAt?: number;
  /** 会话过期时间 */
  sessionExpiresAt?: number;
}

/**
 * 刷新会话请求
 */
export interface RefreshSessionRequest {
  refreshToken: string;
  sessionUuid: string;
}

/**
 * 刷新会话响应
 */
export interface RefreshSessionResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: string;
}

/**
 * 通用认证操作结果
 */
export interface AuthOperationResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

