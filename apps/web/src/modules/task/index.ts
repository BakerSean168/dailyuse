/**
 * Task Web Module
 * 任务Web模块导出
 */

// ===== Presentation Layer =====
export { useTaskStore } from './presentation/stores/taskStore';
export type { TaskStoreType } from './presentation/stores/taskStore';
export { useTask } from './presentation/composables/useTask';

// 导出初始化任务
export { registerTaskInitializationTasks } from './initialization';
