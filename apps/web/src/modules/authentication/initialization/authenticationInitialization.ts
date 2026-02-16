/**
 * 认证模块初始化任务注册
 * Authentication Module Initialization Tasks
 *
 * 使用 DI 注入的 AuthClientService 和 authenticationStore 管理认证状态恢复。
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import { useAuthenticationStore } from '../presentation/stores/authenticationStore';
import { authService } from '@/shared/di';

/**
 * 注册认证模块的所有初始化任务
 */
export function registerAuthenticationInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // 1. 认证状态恢复任务
  const authStateRestoreTask: InitializationTask = {
    name: 'auth-state-restore',
    phase: InitializationPhase.APP_STARTUP,
    priority: 15,
    initialize: async () => {
      console.log('🔐 [AuthModule] 恢复认证状态');
      const authStore = useAuthenticationStore();

      // 从 Pinia 持久化中恢复的 token
      const accessToken = authStore.accessToken;

      if (!accessToken) {
        console.log('ℹ️ [AuthModule] 未发现 Access Token，跳过状态恢复');
        authStore.setLoading(false);
        return;
      }

      // 检查 token 是否过期
      if (authStore.isTokenExpired) {
        console.log('⚠️ [AuthModule] Token 已过期，尝试刷新');
        const refreshToken = authStore.refreshToken;
        if (refreshToken) {
            const result = await authService.refreshToken({ refreshToken });
            if (result.ok) {
              authStore.handleAuthResponse(result.data);
              console.log('✅ [AuthModule] Token 刷新成功');
            } else {
              console.warn('❌ [AuthModule] Token 刷新失败，清除认证状态:', result.error);
              authStore.reset();
            }
        } else {
          console.log('⚠️ [AuthModule] 无 Refresh Token，清除认证状态');
          authStore.reset();
        }
        authStore.setLoading(false);
        return;
      }

      console.log('✅ [AuthModule] 有效的 token，认证状态已恢复');
      authStore.setLoading(false);
    },
    cleanup: async () => {
      console.log('🧹 [AuthModule] 清理认证状态');
      const authStore = useAuthenticationStore();
      authStore.reset();
    },
  };

  // 2. 认证配置初始化任务
  const authConfigInitTask: InitializationTask = {
    name: 'auth-config-init',
    phase: InitializationPhase.APP_STARTUP,
    priority: 10,
    initialize: async () => {
      console.log('⚙️ [AuthModule] 初始化认证配置');
    },
  };

  // 3. 用户会话启动任务
  const userSessionStartTask: InitializationTask = {
    name: 'user-session-start',
    phase: InitializationPhase.USER_LOGIN,
    priority: 5,
    initialize: async (context?: { identityId: string }) => {
      if (context?.identityId) {
        console.log(`👤 [AuthModule] 启动用户会话: ${context.identityId}`);

        // 加载完整的语言包（包含所有业务模块的翻译）
        try {
          const { loadFullLanguageMessages } = await import('@/shared/i18n');
          const currentLocale = localStorage.getItem('locale') as 'zh-CN' | 'en-US' || 'zh-CN';
          await loadFullLanguageMessages(currentLocale);
        } catch (error) {
          console.warn('⚠️ [AuthModule] 加载完整语言包失败:', error);
        }
      }
    },
    cleanup: async () => {
      console.log('🔚 [AuthModule] 结束用户会话');
    },
  };

  // 4. Token 刷新服务任务
  const tokenRefreshServiceTask: InitializationTask = {
    name: 'token-refresh-service',
    phase: InitializationPhase.USER_LOGIN,
    priority: 10,
    dependencies: ['user-session-start'],
    initialize: async () => {
      console.log('🔄 [AuthModule] 启动 Token 刷新服务');
    },
    cleanup: async () => {
      console.log('🛑 [AuthModule] 停止 Token 刷新服务');
    },
  };

  // 注册所有任务
  manager.registerTask(authConfigInitTask);
  manager.registerTask(authStateRestoreTask);
  manager.registerTask(userSessionStartTask);
  manager.registerTask(tokenRefreshServiceTask);

  console.log('📝 [AuthModule] 所有初始化任务已注册');
}
