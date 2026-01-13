/**
 * Account Module - Desktop Main Process
 *
 * 账户模块 - 注册 IPC handlers 和生命周期管理
 *
 * @module account
 *
 * 职责：
 * - 用户账户管理（资料、偏好）
 * - 订阅管理
 * - 本地用户（离线模式）
 *
 * 注意：认证相关功能已移至 authentication 模块
 */

import { InitializationManager, InitializationPhase, createLogger } from '@dailyuse/utils';

const logger = createLogger('AccountModule');

/**
 * 注册 Account 模块到初始化管理器
 *
 * Priority: 130 (after AI module)
 * 
 * 注意：IPC handlers 的注册由 ipc-registry.ts 统一管理
 */
export function registerAccountModule(): void {
  logger.info('Registering Account module...');

  InitializationManager.getInstance().registerTask({
    name: 'account-module',
    phase: InitializationPhase.APP_STARTUP,
    priority: 130, // After AI module (120)

    async initialize() {
      logger.info('Initializing Account module...');

      try {
        // IPC handlers 由 ipc-registry.ts 统一注册
        logger.info('Account module initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize Account module', error);
        throw error;
      }
    },

    async cleanup() {
      logger.info('Cleaning up Account module...');

      try {
        // IPC handlers 的清理由 ipc-registry 统一管理
        logger.info('Account module cleaned up successfully');
      } catch (error) {
        logger.error('Failed to cleanup Account module', error);
      }
    },
  });

  logger.info('Account module registered');
}

// ===== Re-export Application Services =====
export {
  AccountDesktopApplicationService,
  createAccountDesktopApplicationService,
  type LocalDesktopUser,
  type CreateAccountInput,
  type CreateAccountResult,
  type OperationResult,
  type SubscriptionInfo,
  type UsageInfo,
} from './application/AccountDesktopApplicationService';

// ===== Re-export IPC Handlers =====
export {
  registerAccountIpcHandlers,
  unregisterAccountIpcHandlers,
  getAccountIpcChannels,
} from './ipc/account.ipc-handlers';
