/**
 * Authentication Module Initialization
 *
 * Registers Authentication module initialization tasks:
 * - IPC handler setup
 * - TokenManager initialization
 * - SessionManager initialization
 * - Auto-login attempt
 */

import { InitializationManager, InitializationPhase, createLogger } from '@dailyuse/utils';
import { getAuthService } from '../ipc/auth.ipc-handlers';

const logger = createLogger('AuthenticationModuleInit');

export function registerAuthenticationInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  manager.registerTask({
    name: 'authentication-module-initialization',
    phase: InitializationPhase.APP_STARTUP,
    priority: 50,
    dependencies: ['di-container-configuration'],
    initialize: async () => {
      logger.info('Initializing Authentication module...');
      try {
        // 1. 获取认证服务（会自动注入 Repositories）
        const authService = getAuthService();

        // 2. 初始化认证服务（恢复会话）
        const result = await authService.initialize();

        if (result.hasValidSession) {
          logger.info('Session restored successfully', {
            identityId: result.identityId,
            sessionId: result.sessionId,
          });
        } else if (result.needsReLogin) {
          logger.info('No valid session, user needs to login');
        } else if (result.needsRefresh) {
          logger.info('Session needs refresh, will attempt auto-refresh');
        }

        logger.info('Authentication module initialized', {
          hasSession: result.hasValidSession,
        });
      } catch (error) {
        logger.error('Authentication module initialization failed', { error });
        // 不抛出错误，认证失败不应阻止应用启动
        // throw error;
      }
    },
    cleanup: async () => {
      logger.info('Cleaning up Authentication module...');
      try {
        const authService = getAuthService();
        authService.cleanup();
        logger.info('Authentication module cleaned up');
      } catch (error) {
        logger.warn('Authentication module cleanup failed', { error });
      }
    },
  });
}
