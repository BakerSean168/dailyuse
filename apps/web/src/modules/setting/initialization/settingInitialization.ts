import {
  InitializationPhase,
  type InitializationTask,
  InitializationManager,
} from '@dailyuse/utils';
import { useUserSettingStore } from '../presentation/stores/userSettingStore';
import { useAuthenticationStore } from '@dailyuse/app-vue';

/**
 * 注册设置模块初始化任务
 */
export function registerSettingInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // 用户登录后加载设置
  const loadUserSettingsTask: InitializationTask = {
    name: 'load-user-settings',
    phase: InitializationPhase.USER_LOGIN,
    priority: 15, // 在认证之后、其他模块之前
    initialize: async () => {
      const authStore = useAuthenticationStore();
      const settingStore = useUserSettingStore();

      if (!authStore.isAuthenticated) {
        console.log('⏭️ [Setting] 用户未登录，跳过设置加载');
        return;
      }

      console.log('📥 [Setting] 开始加载用户设置...');

      try {
        // 加载用户设置
        await settingStore.loadSettings();
        console.log('✅ [Setting] 用户设置加载完成');

        // 加载默认设置（用于重置功能）
        await settingStore.loadDefaults();
        console.log('✅ [Setting] 默认设置加载完成');

        // 注意：主题应用现在由 Theme 模块自动处理
      } catch (error) {
        console.error('❌ [Setting] 设置加载失败:', error);
        // 不抛出错误，允许应用在设置加载失败时使用默认值
      }
    },
    cleanup: async () => {
      // 清理设置（登出时）
      const settingStore = useUserSettingStore();
      settingStore.$reset();
      console.log('🧹 [Setting] 设置已清理');
    },
  };

  manager.registerTask(loadUserSettingsTask);

  console.log('📝 [Setting] 设置模块初始化任务已注册');
}
