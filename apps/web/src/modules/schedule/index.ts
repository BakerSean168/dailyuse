/**
 * Schedule Web Module
 * 调度Web模块导出
 */

// ===== Presentation Layer =====
export { useScheduleStore } from './presentation/stores/scheduleStore';
export type { ScheduleStoreType } from './presentation/stores/scheduleStore';
export { useSchedule } from './presentation/composables/useSchedule';

// 导出路由
export { scheduleRoutes } from './presentation/router';

// 导出组件
export * from './presentation/components';

// 导出初始化
export { registerScheduleInitializationTasks } from './initialization/scheduleInitialization';
