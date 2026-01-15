/**
 * Auth Module IPC Handlers
 *
 * 使用 createModuleIpcHandlers 简化的 Auth IPC 处理器
 * 每个 handler 都是对 AuthDesktopApplicationService 的一行委托
 *
 * 架构优势：
 * - 统一的错误处理和日志记录
 * - 极简的 handler 定义
 * - 清晰的 channel 列表
 * - 支持 TokenManager 和 SessionManager 集成
 */

import { createLogger } from '@dailyuse/utils';
import { createModuleIpcHandlers } from '../../../utils';
import type { IpcResult, CountResult } from '@dailyuse/contracts/result';
import {
  AuthDesktopApplicationService,
  createAuthDesktopApplicationService,
  type LoginCredentials,
  type RegisterRequest,
  type AuthStatus,
  type TwoFactorStatus,
  type ApiKeyInfo,
  type SessionInfo,
  type DeviceInfo,
  type AutoLoginResult,
  type SessionRestoreResult,
} from '../application/AuthDesktopApplicationService';
import type { TokenStatus } from '../infrastructure';
import type { SessionStatus } from '../infrastructure';
import { SqliteAuthSessionRepository } from '../../../di/sqlite-adapters/auth-session.sqlite-repository';
import { SqliteAuthCredentialRepository } from '../../../di/sqlite-adapters/auth-credential.sqlite-repository';

const logger = createLogger('AuthIpcHandlers');

// 惰性初始化的服务实例
let service: AuthDesktopApplicationService | null = null;
let isRepositoriesInjected = false;

function getService(): AuthDesktopApplicationService {
  if (!service) {
    service = createAuthDesktopApplicationService(logger);
  }
  return service;
}

/**
 * 确保 Repositories 已注入
 */
function ensureRepositoriesInjected(): void {
  if (isRepositoriesInjected) {
    return;
  }

  const svc = getService();
  const sessionRepo = new SqliteAuthSessionRepository();
  const credentialRepo = new SqliteAuthCredentialRepository();
  svc.setRepositories(sessionRepo, credentialRepo);
  isRepositoriesInjected = true;
  logger.info('Repositories injected to AuthDesktopApplicationService');
}

// 创建模块 IPC handler 注册器
const { handle, register, getChannels } = createModuleIpcHandlers('Auth', logger);

// ============================================
// Initialization & Auto-Login Handlers (NEW)
// ============================================

/**
 * @description 初始化认证服务（应用启动时调用）
 * Channel Name: auth:initialize
 * Payload: void
 * Return: SessionRestoreResult { success, hasValidSession, accountUuid?, needsRefresh?, needsReLogin? }
 * Security: None
 */
handle<void, SessionRestoreResult>(
  'auth:initialize',
  async () => {
    ensureRepositoriesInjected();
    return getService().initialize();
  },
);

/**
 * @description 自动登录（使用存储的 Token）
 * Channel Name: auth:auto-login
 * Payload: void
 * Return: AutoLoginResult { success, authenticated, accountUuid?, sessionUuid?, needsReLogin? }
 * Security: None
 */
handle<void, AutoLoginResult>(
  'auth:auto-login',
  async () => {
    ensureRepositoriesInjected();
    return getService().autoLogin();
  },
);

/**
 * @description 获取 Token 状态
 * Channel Name: auth:token-status
 * Payload: void
 * Return: TokenStatus { hasValidToken, isAccessTokenExpired, shouldRefresh, ... }
 * Security: None
 */
handle<void, TokenStatus>(
  'auth:token-status',
  () => getService().getTokenStatus(),
);

/**
 * @description 获取会话状态
 * Channel Name: auth:session-status
 * Payload: void
 * Return: SessionStatus | null
 * Security: None
 */
handle<void, SessionStatus | null>(
  'auth:session-status',
  () => getService().getSessionStatus(),
);

/**
 * @description 清理过期会话
 * Channel Name: auth:cleanup-sessions
 * Payload: void
 * Return: number (清理的会话数量)
 * Security: Requires authentication
 */
handle<void, number>(
  'auth:cleanup-sessions',
  () => getService().cleanupExpiredSessions(),
);

// ============================================
// Core Auth Handlers
// ============================================

/**
 * @description 用户登录
 * Channel Name: auth:login
 * Payload: LoginCredentials { email, password, rememberMe? }
 * Return: IpcResult<{ accountUuid, sessionUuid }> - 统一格式 { ok, data?, error? }
 * Security: None
 */
handle<LoginCredentials, IpcResult<{ accountUuid: string; sessionUuid: string }>>(
  'auth:login',
  (credentials) => {
    ensureRepositoriesInjected();
    return getService().login(credentials);
  },
);

/**
 * @description 用户注册
 * Channel Name: auth:register
 * Payload: RegisterRequest { email, password, username }
 * Return: IpcResult<{ accountUuid, message }> - 统一格式 { ok, data?, error? }
 * Security: None
 */
handle<RegisterRequest, IpcResult<{ accountUuid: string; message: string }>>(
  'auth:register',
  (request) => {
    ensureRepositoriesInjected();
    return getService().register(request);
  },
);

/**
 * @description 用户登出
 * Channel Name: auth:logout
 * Payload: void
 * Return: IpcResult<void> - 统一格式 { ok, error? }
 * Security: Requires authentication
 */
handle<void, IpcResult<void>>(
  'auth:logout',
  () => getService().logout(),
);

/**
 * @description 刷新访问令牌
 * Channel Name: auth:refresh-token
 * Payload: void
 * Return: IpcResult<{ accessToken, expiresIn }> - 统一格式 { ok, data?, error? }
 * Security: Requires valid refresh token
 */
handle<void, IpcResult<{ accessToken: string; expiresIn: number }>>(
  'auth:refresh-token',
  () => getService().refreshToken(),
);

/**
 * @description 进入离线模式
 * Channel Name: auth:enter-offline-mode
 * Payload: void
 * Return: IpcResult<{ accountUuid, mode, message }> - 统一格式 { ok, data?, error? }
 * Security: None
 */
handle<void, IpcResult<{ accountUuid: string; mode: string; message: string }>>(
  'auth:enter-offline-mode',
  () => {
    ensureRepositoriesInjected();
    return getService().enterOfflineMode();
  },
);

/**
 * @description 验证令牌有效性
 * Channel Name: auth:verify-token
 * Payload: string (token)
 * Return: { valid: boolean, error?: string }
 * Security: None
 */
handle<string, { valid: boolean; error?: string }>(
  'auth:verify-token',
  (token) => getService().verifyToken(token),
);

/**
 * @description 获取当前认证状态
 * Channel Name: auth:get-status
 * Payload: void
 * Return: AuthStatus { authenticated, mode, user?, session?, tokenStatus? }
 * Security: None
 */
handle<void, AuthStatus>(
  'auth:get-status',
  () => getService().getStatus(),
);

// ============================================
// 2FA Handlers
// ============================================

/**
 * @description 启用双因素认证
 * Channel Name: auth:2fa:enable
 * Payload: string (method, e.g. 'totp')
 * Return: IpcResult<{ qrCodeUrl?, secret? }> - 统一格式 { ok, data?, error? }
 * Security: Requires authentication
 */
handle<string, IpcResult<{ qrCodeUrl?: string; secret?: string }>>(
  'auth:2fa:enable',
  (method) => getService().enable2FA(method || 'totp'),
);

/**
 * @description 禁用双因素认证
 * Channel Name: auth:2fa:disable
 * Payload: void
 * Return: IpcResult<void> - 统一格式 { ok, error? }
 * Security: Requires authentication
 */
handle<void, IpcResult<void>>(
  'auth:2fa:disable',
  () => getService().disable2FA(),
);

/**
 * @description 验证双因素认证代码
 * Channel Name: auth:2fa:verify
 * Payload: string (code)
 * Return: IpcResult<void> - 统一格式 { ok, error? }
 * Security: Requires authentication
 */
handle<string, IpcResult<void>>(
  'auth:2fa:verify',
  (code) => getService().verify2FA(code),
);

/**
 * @description 获取双因素认证状态
 * Channel Name: auth:2fa:get-status
 * Payload: void
 * Return: TwoFactorStatus { enabled, method }
 * Security: Requires authentication
 */
handle<void, TwoFactorStatus>(
  'auth:2fa:get-status',
  () => getService().get2FAStatus(),
);

/**
 * @description 生成备用代码
 * Channel Name: auth:2fa:generate-backup-codes
 * Payload: void
 * Return: { codes: string[] }
 * Security: Requires authentication
 */
handle<void, { codes: string[] }>(
  'auth:2fa:generate-backup-codes',
  () => getService().generateBackupCodes(),
);

// ============================================
// API Key Handlers
// ============================================

/**
 * @description 创建 API 密钥
 * Channel Name: auth:api-key:create
 * Payload: { name: string; scopes?: string[] }
 * Return: { uuid: string; key: string } | null
 * Security: Requires authentication
 */
handle<{ name: string; scopes?: string[] }, { uuid: string; key: string } | null>(
  'auth:api-key:create',
  (request) => getService().createApiKey(request),
);

/**
 * @description 列出所有 API 密钥
 * Channel Name: auth:api-key:list
 * Payload: void
 * Return: { apiKeys: ApiKeyInfo[]; total: number }
 * Security: Requires authentication
 */
handle<void, { apiKeys: ApiKeyInfo[]; total: number }>(
  'auth:api-key:list',
  () => getService().listApiKeys(),
);

/**
 * @description 撤销 API 密钥
 * Channel Name: auth:api-key:revoke
 * Payload: string (keyId)
 * Return: IpcResult<void> - 统一格式 { ok, error? }
 * Security: Requires authentication
 */
handle<string, IpcResult<void>>(
  'auth:api-key:revoke',
  (keyId) => getService().revokeApiKey(keyId),
);

/**
 * @description 轮换 API 密钥
 * Channel Name: auth:api-key:rotate
 * Payload: string (keyId)
 * Return: { newKey: string | null }
 * Security: Requires authentication
 */
handle<string, { newKey: string | null }>(
  'auth:api-key:rotate',
  (keyId) => getService().rotateApiKey(keyId),
);

// ============================================
// Session Handlers
// ============================================

/**
 * @description 列出所有活动会话
 * Channel Name: auth:session:list
 * Payload: void
 * Return: { sessions: SessionInfo[]; total: number }
 * Security: Requires authentication
 */
handle<void, { sessions: SessionInfo[]; total: number }>(
  'auth:session:list',
  () => getService().listSessions(),
);

/**
 * @description 获取当前会话信息
 * Channel Name: auth:session:get-current
 * Payload: void
 * Return: SessionInfo | null
 * Security: Requires authentication
 */
handle<void, SessionInfo | null>(
  'auth:session:get-current',
  () => getService().getCurrentSession(),
);

/**
 * @description 撤销指定会话
 * Channel Name: auth:session:revoke
 * Payload: string (sessionId)
 * Return: IpcResult<void> - 统一格式 { ok, error? }
 * Security: Requires authentication
 */
handle<string, IpcResult<void>>(
  'auth:session:revoke',
  (sessionId) => getService().revokeSession(sessionId),
);

/**
 * @description 撤销所有会话
 * Channel Name: auth:session:revoke-all
 * Payload: void
 * Return: CountResult - 受影响的会话数量
 * Security: Requires authentication
 */
handle<void, CountResult>(
  'auth:session:revoke-all',
  () => getService().revokeAllSessions(),
);

// ============================================
// Device Handlers
// ============================================

/**
 * @description 列出所有已登录设备
 * Channel Name: auth:device:list
 * Payload: void
 * Return: { devices: DeviceInfo[]; total: number }
 * Security: Requires authentication
 */
handle<void, { devices: DeviceInfo[]; total: number }>(
  'auth:device:list',
  () => getService().listDevices(),
);

/**
 * @description 获取当前设备信息
 * Channel Name: auth:device:get-current
 * Payload: void
 * Return: DeviceInfo
 * Security: Requires authentication
 */
handle<void, DeviceInfo>(
  'auth:device:get-current',
  () => getService().getCurrentDevice(),
);

/**
 * @description 移除设备（登出该设备）
 * Channel Name: auth:device:revoke
 * Payload: string (deviceId)
 * Return: IpcResult<void> - 统一格式 { ok, error? }
 * Security: Requires authentication
 */
handle<string, IpcResult<void>>(
  'auth:device:revoke',
  (deviceId) => getService().revokeDevice(deviceId),
);

/**
 * @description 重命名设备
 * Channel Name: auth:device:rename
 * Payload: { deviceId: string; name: string }
 * Return: IpcResult<void> - 统一格式 { ok, error? }
 * Security: Requires authentication
 */
handle<{ deviceId: string; name: string }, IpcResult<void>>(
  'auth:device:rename',
  ({ deviceId, name }) => getService().renameDevice(deviceId, name),
);

// ============================================
// Export Functions
// ============================================

/**
 * 注册 Auth 模块的 IPC 处理器
 */
export function registerAuthIpcHandlers(): void {
  register();
}

/**
 * 注销 Auth 模块的 IPC 处理器
 */
export function unregisterAuthIpcHandlers(): void {
  const { removeIpcHandlers } = require('../../../utils');
  logger.info('Unregistering Auth IPC handlers...');
  removeIpcHandlers(getChannels());

  // 清理服务
  if (service) {
    service.cleanup();
    service = null;
  }
  isRepositoriesInjected = false;

  logger.info('Auth IPC handlers unregistered');
}

/**
 * 获取所有 Auth IPC channels
 */
export function getAuthIpcChannels(): string[] {
  return getChannels();
}

/**
 * 获取认证服务实例（供初始化模块使用）
 */
export function getAuthService(): AuthDesktopApplicationService {
  ensureRepositoriesInjected();
  return getService();
}
