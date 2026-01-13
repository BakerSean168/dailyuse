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
 */

import { InitializationManager, InitializationPhase, createLogger } from '@dailyuse/utils';

const logger = createLogger('AuthenticationModule');

/**
 * 注册 Authentication 模块到初始化管理器
 *
 * Priority: 135 (after Account module)
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
        // IPC handlers 由 ipc-registry.ts 统一注册
        logger.info('Authentication module initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize Authentication module', error);
        throw error;
      }
    },

    async cleanup() {
      logger.info('Cleaning up Authentication module...');

      try {
        // IPC handlers 的清理由 ipc-registry 统一管理
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
