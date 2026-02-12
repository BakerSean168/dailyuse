/**
 * Goal 模块导出
 *
 * Web 应用层：只负责展示层的导出
 */

// ===== Presentation Layer =====
export { useGoalStore } from './presentation/stores/goalStore';
export type { GoalStoreType } from './presentation/stores/goalStore';
export { useGoal } from './presentation/composables/useGoal';
export { goalRoutes } from './presentation/router';
export { registerGoalWidgets } from './presentation/widgets/registerGoalWidgets';

// 导出初始化相关
export { registerGoalInitializationTasks } from './initialization';
