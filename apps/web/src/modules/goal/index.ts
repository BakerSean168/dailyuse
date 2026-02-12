/**
 * Goal 模块导出
 * 
 * Web 应用层：只负责展示层的导出
 * - 业务逻辑服务应从 @dailyuse/goal/application-client 导入
 * - 本模块只导出 Vue 特定的内容（composables、stores、routes、widgets）
 */

// ===== Presentation Layer =====
export { useGoalStore, getGoalStore } from './presentation/stores/goalStore';
export { useGoal } from './presentation/composables/useGoal';
export { goalRoutes } from './presentation/router';
export { registerGoalWidgets } from './presentation/widgets/registerGoalWidgets';

// 导出初始化相关
export { registerGoalInitializationTasks } from './initialization';

// 导出类型
export type { GoalStore } from './presentation/stores/goalStore';
