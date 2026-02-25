import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import { useRepositoryStore } from '@dailyuse/app-vue';

const repositorySyncStatusTask: InitializationTask = {
  name: 'repository-sync-status',
  phase: InitializationPhase.USER_LOGIN,
  priority: 20,
  initialize: async () => {
    console.log('✅ [Repository] 仓库数据将按需加载');
  },
  cleanup: async () => {
    try {
      const store = useRepositoryStore();
      store.$reset();
      console.log('✅ [Repository] 仓库数据已清理');
    } catch (error) {
      console.error('❌ [Repository] 仓库数据清理失败:', error);
    }
  },
};

export function registerRepositoryInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  manager.registerTask(repositorySyncStatusTask);

  console.log('📝 [Repository] Repository 模块初始化任务已注册');
}
