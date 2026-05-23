/**
 * Auth Desktop Application Service
 *
 * 使用 DDD 最佳实践的 Authentication 应用服务：
 * 1. 整合 TokenManager 和 SessionManager
 * 2. 支持离线模式和在线模式
 * 3. Steam-like 认证流程（离线优先 + 可选云端同步）
 * 4. 统一的类型定义
 *
 * 架构原则：
 * - Application Service 只负责编排，不包含业务逻辑
 * - TokenManager 负责 Token 加密存储
 * - SessionManager 负责会话生命周期管理
 * - Desktop 支持离线模式和在线模式切换
 *
 * 响应格式说明：
 * - 所有方法返回 IpcResult<T> 格式（使用 ok/fail）
 * - 成功: { ok: true, data: T }
 * - 失败: { ok: false, error: { code, message } }
 */

import { createLogger, type ILogger } from '@dailyuse/utils';
import type {
  IAuthSessionRepository,
  IAuthIdentityRepository as IAuthCredentialRepository,
} from '@dailyuse/authentication/domain-server';
import type { IAccountRepository } from '@dailyuse/account/domain-server';
import {
  type IpcResult,
  toIpcResult,
  ok,
  fail,
} from '@dailyuse/contracts/result';
import {
  AuthMode,
  AuthRuntimeState,
  type AuthResponseDTO,
  type GetCurrentUserRes,
  type TokenStatus,
  type TwoFactorStatus,
  type ApiKeyInfo,
  type AuthStatus,
  type EmailLoginCredentials,
  type DeviceInfoUI,
  type ListSessionsRes,
  type RememberedDesktopAccountDTO,
  type RememberedDesktopAccountLoginReq,
  type AuthBootstrapSnapshot,
  type SessionInfo,
} from '@dailyuse/contracts/authentication';
import {
  TokenManager,
  getTokenManager,
  SessionManager,
  createSessionManager,
  getRememberedAccountsService,
  type SessionStatus,
} from '../infrastructure';
import { AuthRemoteGateway, type RegisterApiResponse } from './AuthRemoteGateway';
import { DesktopAuthAccountProjectionService } from './DesktopAuthAccountProjectionService';
import { DesktopRememberedAccountService } from './DesktopRememberedAccountService';
import { DesktopCredentialAuthCoordinator, type AuthState, type RegisterRequest } from './DesktopCredentialAuthCoordinator';
import {
  DesktopAuthLifecycleCoordinator,
  type AutoLoginResult,
  type SessionRestoreResult,
} from './DesktopAuthLifecycleCoordinator';
import { DesktopAuthSecurityAdminService } from './DesktopAuthSecurityAdminService';

// Re-export from contracts for convenience
export type { IpcResult, TwoFactorStatus, ApiKeyInfo, AuthStatus, EmailLoginCredentials };
export type { DeviceInfoUI } from '@dailyuse/contracts/authentication';
export { AuthMode, toIpcResult, ok, fail };

// Re-export lifecycle types
export type { AutoLoginResult, SessionRestoreResult } from './DesktopAuthLifecycleCoordinator';

// Alias for backward compatibility
export type LoginCredentials = EmailLoginCredentials;

// ===== Application Service =====

/**
 * Auth Desktop Application Service
 *
 * 为 Desktop IPC handlers 提供统一的认证应用服务入口
 * 支持离线模式和在线模式切换
 */
export class AuthDesktopApplicationService {
  private readonly logger: ILogger;
  private readonly tokenManager: TokenManager;
  private readonly remoteGateway: AuthRemoteGateway;
  private readonly rememberedAccountService: DesktopRememberedAccountService;
  private projectionService: DesktopAuthAccountProjectionService;
  private sessionManager: SessionManager | null = null;
  private credentialCoordinator: DesktopCredentialAuthCoordinator | null = null;
  private lifecycleCoordinator: DesktopAuthLifecycleCoordinator | null = null;
  private securityAdminService: DesktopAuthSecurityAdminService | null = null;

  // 依赖注入的 Repositories（惰性初始化）
  private sessionRepository: IAuthSessionRepository | null = null;
  private credentialRepository: IAuthCredentialRepository | null = null;
  private accountRepository: IAccountRepository | null = null;

  // 共享认证状态
  private readonly authState: AuthState = {
    authMode: AuthMode.UNAUTHENTICATED,
    runtimeState: AuthRuntimeState.UNINITIALIZED,
  };
  private isInitialized = { value: false };

  constructor(logger?: ILogger) {
    this.logger = logger || createLogger('AuthDesktopAppService');
    this.tokenManager = getTokenManager(this.logger);
    this.remoteGateway = new AuthRemoteGateway();
    this.rememberedAccountService = new DesktopRememberedAccountService(
      this.logger,
      getRememberedAccountsService(),
    );
    this.projectionService = new DesktopAuthAccountProjectionService(
      this.logger,
      this.tokenManager,
      this.accountRepository,
    );
  }

  private createLifecycleCoordinator(): DesktopAuthLifecycleCoordinator {
    return new DesktopAuthLifecycleCoordinator(
      this.logger,
      this.tokenManager,
      this.remoteGateway,
      this.sessionManager,
      this.projectionService,
      this.rememberedAccountService,
      this.credentialRepository,
      this.sessionRepository,
      this.authState,
      this.isInitialized,
    );
  }

  private createCredentialCoordinator(): DesktopCredentialAuthCoordinator {
    return new DesktopCredentialAuthCoordinator(
      this.logger,
      this.tokenManager,
      this.remoteGateway,
      this.sessionManager!,
      this.projectionService,
      this.rememberedAccountService,
      this.credentialRepository,
      this.sessionRepository,
      this.authState,
    );
  }

  private createSecurityAdminService(): DesktopAuthSecurityAdminService {
    return new DesktopAuthSecurityAdminService(
      this.logger,
      this.sessionManager,
      this.tokenManager,
      this.credentialRepository,
      this.sessionRepository,
      this.authState,
    );
  }

  /**
   * 设置 Repositories（延迟注入）
   */
  setRepositories(
    sessionRepository: IAuthSessionRepository,
    credentialRepository: IAuthCredentialRepository,
  ): void {
    this.sessionRepository = sessionRepository;
    this.credentialRepository = credentialRepository;

    // 创建 SessionManager
    this.sessionManager = createSessionManager(
      sessionRepository,
      credentialRepository,
      this.logger,
    );

    this.sessionManager.setApiCallbacks({
      refreshToken: (request) => this.remoteGateway.refreshToken(request),
    });

    this.credentialCoordinator = this.createCredentialCoordinator();
    this.lifecycleCoordinator = this.createLifecycleCoordinator();
    this.securityAdminService = this.createSecurityAdminService();

    this.logger.info('Repositories injected');
  }

  setAccountRepository(accountRepository: IAccountRepository): void {
    this.accountRepository = accountRepository;
    this.projectionService = new DesktopAuthAccountProjectionService(
      this.logger,
      this.tokenManager,
      accountRepository,
    );
    // Recreate coordinators with updated projection service
    if (this.sessionManager && this.credentialRepository && this.sessionRepository) {
      this.credentialCoordinator = this.createCredentialCoordinator();
      this.lifecycleCoordinator = this.createLifecycleCoordinator();
      this.securityAdminService = this.createSecurityAdminService();
    }
  }

  /**
   * 注入离线认证依赖
   * 将 IAuthIdentityRepository + IPasswordHasher 传递给 SessionManager
   */
  setOfflineAuthDependencies(
    identityRepository: import('@dailyuse/authentication/domain-server').IAuthIdentityRepository,
    passwordHasher: import('@dailyuse/authentication/domain-shared').IPasswordHasher,
  ): void {
    if (this.sessionManager) {
      this.sessionManager.setOfflineAuthDependencies(identityRepository, passwordHasher);
    } else {
      this.logger.warn('SessionManager not initialized, cannot set offline auth dependencies');
    }
  }

  /**
   * 初始化认证服务
   */
  async initialize(): Promise<SessionRestoreResult> {
    return this.requireLifecycle().initialize();
  }

  // ============================================
  // Core Auth Methods (delegated to credential coordinator)
  // ============================================

  async login(credentials: LoginCredentials): Promise<IpcResult<AuthResponseDTO>> {
    return this.requireCoordinator().login(credentials);
  }

  async loginRememberedAccount(
    request: RememberedDesktopAccountLoginReq,
  ): Promise<IpcResult<AuthResponseDTO>> {
    return this.requireCoordinator().loginRememberedAccount(request);
  }

  async register(request: RegisterRequest): Promise<IpcResult<AuthResponseDTO>> {
    return this.requireCoordinator().register(request);
  }

  async completeRegisterSuccess(
    data: RegisterApiResponse | AuthResponseDTO,
    request: RegisterRequest,
  ): Promise<void> {
    return this.requireCoordinator().completeRegisterSuccess(data, request);
  }

  async enterGuestMode(): Promise<
    IpcResult<{ identityId: string; mode: AuthMode; message: string }>
  > {
    return this.requireCoordinator().enterGuestMode();
  }

  async logout(): Promise<IpcResult<void>> {
    if (!this.credentialCoordinator) {
      await this.tokenManager.clearTokens();
      this.authState.authMode = AuthMode.UNAUTHENTICATED;
      this.authState.runtimeState = AuthRuntimeState.UNAUTHENTICATED;
      return toIpcResult(ok(undefined));
    }
    return this.credentialCoordinator.logout();
  }

  async completeRemoteLoginSuccess(
    response: AuthResponseDTO,
    request: {
      email: string;
      password: string;
      rememberPassword?: boolean;
      autoLogin?: boolean;
    },
  ): Promise<void> {
    if (!this.credentialCoordinator) {
      throw new Error('Auth service is not initialized for profile login persistence');
    }
    return this.credentialCoordinator.completeRemoteLoginSuccess(response, request);
  }

  private requireCoordinator(): DesktopCredentialAuthCoordinator {
    if (!this.credentialCoordinator) {
      throw new Error('Credential coordinator not initialized. Call setRepositories() first.');
    }
    return this.credentialCoordinator;
  }

  private requireLifecycle(): DesktopAuthLifecycleCoordinator {
    if (!this.lifecycleCoordinator) {
      throw new Error('Lifecycle coordinator not initialized. Call setRepositories() first.');
    }
    return this.lifecycleCoordinator;
  }

  /**
   * 自动登录
   */
  async autoLogin(): Promise<AutoLoginResult> {
    return this.requireLifecycle().autoLogin();
  }

  /**
   * 刷新令牌
   */
  async refreshToken(): Promise<IpcResult<AuthResponseDTO>> {
    return this.requireLifecycle().refreshToken();
  }

  /**
   * 验证令牌
   */
  async verifyToken(token: string): Promise<{ valid: boolean; error?: string }> {
    return this.requireLifecycle().verifyToken(token);
  }

  /**
   * 获取认证状态
   */
  async getStatus(): Promise<AuthStatus> {
    return this.requireLifecycle().getStatus();
  }

  async buildBootstrapSnapshot(): Promise<AuthBootstrapSnapshot> {
    return this.requireLifecycle().buildBootstrapSnapshot();
  }

  /**
   * 获取 Token 状态
   */
  async getTokenStatus(): Promise<TokenStatus> {
    return this.requireLifecycle().getTokenStatus();
  }

  /**
   * 获取会话状态
   */
  async getSessionStatus(): Promise<SessionStatus | null> {
    return this.requireLifecycle().getSessionStatus();
  }

  // ============================================
  // Security Admin Methods (delegated)
  // ============================================

  async enable2FA(method: string): Promise<IpcResult<{ qrCodeUrl?: string; secret?: string }>> {
    return this.requireSecurityAdmin().enable2FA(method);
  }

  async disable2FA(): Promise<IpcResult<void>> {
    return this.requireSecurityAdmin().disable2FA();
  }

  async verify2FA(code: string): Promise<IpcResult<void>> {
    return this.requireSecurityAdmin().verify2FA(code);
  }

  async get2FAStatus(): Promise<TwoFactorStatus> {
    return this.requireSecurityAdmin().get2FAStatus();
  }

  async generateBackupCodes(): Promise<{ codes: string[] }> {
    return this.requireSecurityAdmin().generateBackupCodes();
  }

  async createApiKey(request: {
    name: string;
    scopes?: string[];
  }): Promise<{ id: string; key: string } | null> {
    return this.requireSecurityAdmin().createApiKey(request);
  }

  async listApiKeys(): Promise<{ apiKeys: ApiKeyInfo[]; total: number }> {
    return this.requireSecurityAdmin().listApiKeys();
  }

  async revokeApiKey(keyId: string): Promise<IpcResult<void>> {
    return this.requireSecurityAdmin().revokeApiKey(keyId);
  }

  async rotateApiKey(keyId: string): Promise<{ newKey: string | null }> {
    return this.requireSecurityAdmin().rotateApiKey(keyId);
  }

  async listSessions(): Promise<ListSessionsRes> {
    return this.requireSecurityAdmin().listSessions();
  }

  async getCurrentUser(): Promise<GetCurrentUserRes> {
    return this.requireSecurityAdmin().getCurrentUser();
  }

  async getCurrentSession(): Promise<SessionInfo | null> {
    return this.requireSecurityAdmin().getCurrentSession();
  }

  async revokeSession(sessionId?: string): Promise<IpcResult<void>> {
    return this.requireSecurityAdmin().revokeSession(sessionId);
  }

  async revokeAllSessions(): Promise<{ ok: boolean; count: number }> {
    return this.requireSecurityAdmin().revokeAllSessions();
  }

  async listDevices(): Promise<{ devices: DeviceInfoUI[]; total: number }> {
    return this.requireSecurityAdmin().listDevices();
  }

  async getCurrentDevice(): Promise<DeviceInfoUI> {
    return this.requireSecurityAdmin().getCurrentDevice();
  }

  async revokeDevice(deviceId: string): Promise<IpcResult<void>> {
    return this.requireSecurityAdmin().revokeDevice(deviceId);
  }

  async renameDevice(deviceId: string, name: string): Promise<IpcResult<void>> {
    return this.requireSecurityAdmin().renameDevice(deviceId, name);
  }

  // ============================================
  // Identity/Context Helpers (remain on facade)
  // ============================================

  getCurrentIdentityId(): string | null {
    if (this.authState.runtimeState === AuthRuntimeState.RESTORING) {
      return null;
    }

    const currentSession = this.sessionManager?.getCurrentSession();
    if (currentSession?.identityId) {
      return currentSession.identityId;
    }

    const tokenData = this.tokenManager.getCachedTokenData();
    return tokenData?.identityId ?? null;
  }

  getCurrentSessionId(): string | null {
    if (this.authState.runtimeState === AuthRuntimeState.RESTORING) {
      return null;
    }

    const currentSession = this.sessionManager?.getCurrentSession();
    if (currentSession?.id) {
      return currentSession.id;
    }

    const tokenData = this.tokenManager.getCachedTokenData();
    return tokenData?.sessionId ?? null;
  }

  getCurrentRequestContext(): { identityId: string; deviceId: string } | null {
    if (this.authState.runtimeState === AuthRuntimeState.RESTORING) {
      return null;
    }

    const session = this.sessionManager?.getCurrentSession();
    if (!session) {
      const identityId = this.getCurrentIdentityId();
      if (!identityId) {
        return null;
      }

      return {
        identityId,
        deviceId: 'desktop-app',
      };
    }

    return {
      identityId: session.identityId,
      deviceId: session.deviceInfo?.deviceId ?? 'desktop-app',
    };
  }

  getRuntimeState(): AuthRuntimeState {
    return this.authState.runtimeState;
  }

  async getRememberedAccounts(): Promise<RememberedDesktopAccountDTO[]> {
    return this.rememberedAccountService.getRememberedAccounts();
  }

  async removeRememberedAccount(identityId: string): Promise<IpcResult<void>> {
    return this.rememberedAccountService.removeRememberedAccount(identityId);
  }

  private requireSecurityAdmin(): DesktopAuthSecurityAdminService {
    if (!this.securityAdminService) {
      throw new Error('Security admin service not initialized. Call setRepositories() first.');
    }
    return this.securityAdminService;
  }

  // ============================================
  // Cleanup Methods
  // ============================================

  /**
   * 清理过期会话
   */
  async cleanupExpiredSessions(): Promise<number> {
    return this.requireLifecycle().cleanupExpiredSessions();
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.requireLifecycle().cleanup();
  }
}

// ===== Factory Function =====

/**
 * 创建 AuthDesktopApplicationService 实例
 */
export function createAuthDesktopApplicationService(
  logger?: ILogger,
): AuthDesktopApplicationService {
  return new AuthDesktopApplicationService(logger);
}
