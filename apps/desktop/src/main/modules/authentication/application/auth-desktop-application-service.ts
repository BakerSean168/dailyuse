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

import { createLogger } from '@dailyuse/utils/logger';
import type { ILogger } from '@dailyuse/utils/logger';
import type {
  IAuthSessionRepository,
  IAuthIdentityRepository as IAuthCredentialRepository,
} from '@dailyuse/authentication/electron';
import type { IAccountRepository } from '@dailyuse/account/electron';
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
  type AuthStatus,
  type EmailLoginCredentials,
  type ListSessionsRes,
  type RememberedDesktopAccountDTO,
  type RememberedDesktopAccountLoginReq,
  type AuthBootstrapSnapshot,
} from '@dailyuse/contracts/authentication';
import {
  TokenManager,
  SessionManager
} from '../infrastructure';
import type { RememberedAccountsService, NetworkStateManager } from '../infrastructure';
import { AuthRemoteGateway, type RegisterApiResponse } from './auth-remote-gateway';
import { DesktopAuthAccountProjectionService } from './desktop-auth-account-projection-service';
import { DesktopRememberedAccountService } from './desktop-remembered-account-service';
import { DesktopCredentialAuthCoordinator, type AuthState, type EmailRegisterCredentials } from './desktop-credential-auth-coordinator';
import {
  DesktopAuthLifecycleCoordinator,
  type AutoLoginResult,
  type SessionRestoreResult,
} from './desktop-auth-lifecycle-coordinator';
import { DesktopAuthSecurityAdminService } from './desktop-auth-security-admin-service';
import { safeTransition } from './auth-coordinator-helpers';
import type { WindowManager } from '../../../lifecycle/window-manager';
import { toCloudAccessToken } from '../infrastructure/session-types';

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

  constructor(
    tokenManager: TokenManager,
    rememberedAccountsService: RememberedAccountsService,
    private readonly networkStateManager: NetworkStateManager,
    private readonly windowManager: WindowManager,
    logger?: ILogger,
  ) {
    this.logger = logger || createLogger('AuthDesktopAppService');
    this.tokenManager = tokenManager;
    this.remoteGateway = new AuthRemoteGateway();
    this.rememberedAccountService = new DesktopRememberedAccountService(
      this.logger,
      rememberedAccountsService,
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
      this.networkStateManager,
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
    return new DesktopCredentialAuthCoordinator({
      logger: this.logger,
      tokenManager: this.tokenManager,
      networkStateManager: this.networkStateManager,
      remoteGateway: this.remoteGateway,
      sessionManager: this.sessionManager!,
      projectionService: this.projectionService,
      rememberedAccountService: this.rememberedAccountService,
      credentialRepository: this.credentialRepository,
      sessionRepository: this.sessionRepository,
      authState: this.authState,
      windowManager: this.windowManager,
    });
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
   * Configure shared auth directory and activate the profile session.
   * Encapsulates the session manager coordination that was previously
   * done externally via getSessionManager().
   */
  async configureAndActivateProfile(sharedAuthDir: string): Promise<void> {
    if (!this.sessionManager) {
      throw new Error('SessionManager not available — call setRepositories() first');
    }
    this.sessionManager.setSharedAuthDir(sharedAuthDir);
    await this.sessionManager.activateProfile();
  }

  /**
   * 清理 SessionManager（供 profile teardown 使用）
   */
  cleanupSessionManager(): void {
    if (this.sessionManager) {
      this.sessionManager.cleanup();
    }
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
    this.sessionManager = new SessionManager(
      sessionRepository,
      credentialRepository,
      this.tokenManager,
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
    identityRepository: import('@dailyuse/authentication/electron').IAuthIdentityRepository,
    passwordHasher: import('@dailyuse/authentication/electron').IPasswordHasher,
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

  async login(credentials: EmailLoginCredentials): Promise<IpcResult<AuthResponseDTO>> {
    return this.requireCoordinator().login(credentials);
  }

  async loginRememberedAccount(
    request: RememberedDesktopAccountLoginReq,
  ): Promise<IpcResult<AuthResponseDTO>> {
    return this.requireCoordinator().loginRememberedAccount(request);
  }

  async register(request: EmailRegisterCredentials): Promise<IpcResult<AuthResponseDTO>> {
    return this.requireCoordinator().register(request);
  }

  async completeRegisterSuccess(
    data: RegisterApiResponse | AuthResponseDTO,
    request: EmailRegisterCredentials,
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
      safeTransition(this.authState, AuthRuntimeState.UNAUTHENTICATED);
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

  /**
   * Synchronous cached access token for online API calls from the desktop shell.
   * 桌面壳层在线 API 调用使用的同步缓存 access token。
   */
  getAccessToken(): string | null {
    return toCloudAccessToken(this.tokenManager.getCachedTokenData()?.accessToken ?? null);
  }

  /**
   * 获取会话状态
   */

  // ============================================
  // Security Admin Methods (delegated)
  // ============================================

  async listSessions(): Promise<ListSessionsRes> {
    return this.requireSecurityAdmin().listSessions();
  }

  async getCurrentUser(): Promise<GetCurrentUserRes> {
    return this.requireSecurityAdmin().getCurrentUser();
  }


  async revokeSession(sessionId?: string): Promise<IpcResult<void>> {
    return this.requireSecurityAdmin().revokeSession(sessionId);
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
  tokenManager: TokenManager,
  rememberedAccountsService: RememberedAccountsService,
  networkStateManager: NetworkStateManager,
  windowManager: WindowManager,
  logger?: ILogger,
): AuthDesktopApplicationService {
  return new AuthDesktopApplicationService(tokenManager, rememberedAccountsService, networkStateManager, windowManager, logger);
}
