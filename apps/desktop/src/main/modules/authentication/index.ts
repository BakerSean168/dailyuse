/**
 * Authentication Module - Desktop Main Process
 *
 * 认证授权模块 - 注册 IPC handlers 和生命周期管理
 *
 * @module authentication
 *
 * 职责：
 * - 用户登录/登出
 * - 2FA 双因素认证
 * - Session 会话管理
 * - API Key 管理
 * - Device 设备管理
 * - 网络状态监控
 */

import { InitializationManager, InitializationPhase, createLogger } from '@dailyuse/utils';
import { getNetworkStateManager } from './infrastructure';
import { getAuthService } from './ipc/auth.ipc-handlers';

const logger = createLogger('AuthenticationModule');

/**
 * 注册 Authentication 模块到初始化管理器
 *
 * Priority: 135 (after Account module)
 * 
 * 初始化流程：
 * 1. 初始化 NetworkStateManager
 * 2. 初始化 AuthDesktopApplicationService
 * 3. 尝试恢复会话 / 自动登录
 * 4. 设置网络状态回调
 * 
 * 注意：IPC handlers 的注册由 ipc-registry.ts 统一管理
 */
export function registerAuthenticationModule(): void {
  logger.info('Registering Authentication module...');

  InitializationManager.getInstance().registerTask({
    name: 'authentication-module',
    phase: InitializationPhase.APP_STARTUP,
    priority: 135, // After Account module (130)

    async initialize() {
      logger.info('Initializing Authentication module...');

      try {
        // 1. 初始化网络状态管理器
        const networkManager = getNetworkStateManager({}, logger);
        await networkManager.initialize();
        logger.info('NetworkStateManager initialized', {
          isOnline: networkManager.isOnline(),
        });

        // 2. 获取认证服务并初始化
        const authService = getAuthService();
        const result = await authService.initialize();

        if (result.hasValidSession) {
          logger.info('Session restored successfully', {
            identityId: result.identityId,
            sessionId: result.sessionId,
          });
        } else if (result.needsReLogin) {
          logger.info('No valid session, user needs to login');
        } else if (result.needsRefresh) {
          logger.info('Session needs refresh');
          // 尝试自动刷新
          const refreshResult = await authService.refreshToken();
          if (refreshResult.ok) {
            logger.info('Token refreshed successfully');
          }
        }

        // 3. 设置网络状态回调
        networkManager.setOnOnline(async () => {
          logger.info('Network online - attempting token refresh');
          try {
            const refreshResult = await authService.refreshToken();
            if (refreshResult.ok) logger.info('Token refreshed after network recovery');
          } catch (error) {
            logger.warn('Failed to refresh token on network restore', { error });
          }
        });

        networkManager.setOnOffline(async () => {
          logger.info('Network offline - switching to offline mode');
        });

        logger.info('Authentication module initialized successfully', {
          hasSession: result.hasValidSession,
          networkStatus: networkManager.getStatus(),
        });
      } catch (error) {
        logger.error('Failed to initialize Authentication module', error);
        // 不抛出错误，认证失败不应阻止应用启动
      }
    },

    async cleanup() {
      logger.info('Cleaning up Authentication module...');

      try {
        // 清理认证服务
        const authService = getAuthService();
        authService.cleanup();

        // 清理网络状态管理器
        const networkManager = getNetworkStateManager();
        networkManager.cleanup();

        logger.info('Authentication module cleaned up successfully');
      } catch (error) {
        logger.error('Failed to cleanup Authentication module', error);
      }
    },
  });

  logger.info('Authentication module registered');
}

// ===== Re-export Application Services =====
export {
  AuthDesktopApplicationService,
  createAuthDesktopApplicationService,
  type AuthOperationResult,
  type LoginCredentials,
  type RegisterRequest,
  type AuthStatus,
  type TwoFactorStatus,
  type ApiKeyInfo,
  type SessionInfo,
  type DeviceInfo,
} from './application/AuthDesktopApplicationService';

// ===== Re-export IPC Handlers =====
export {
  registerAuthIpcHandlers,
  unregisterAuthIpcHandlers,
  getAuthIpcChannels,
} from './ipc/auth.ipc-handlers';

// ===== Re-export Infrastructure =====
export {
  TokenManager,
  getTokenManager,
  SessionManager,
  createSessionManager,
  NetworkStateManager,
  getNetworkStateManager,
  type NetworkStatus,
} from './infrastructure';
