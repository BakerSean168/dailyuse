/**
 * Goal Module - app-vue
 *
 * 目标模块的展示层：stores、composables、router、views、widgets、components。
 * 从 apps/web/src/modules/goal/ 和 packages/ui-vue-shadcn/src/components/custom/goal/ 迁移而来。
 */

// ===== Composables =====
export { useGoal } from './composables';
export { useGoalTimeline } from './composables';
export type { TimelineData, TimelineSnapshot } from './composables';
export { formatTimelineTimestamp } from './composables';

// ===== Stores =====
export { useGoalStore } from './stores/goalStore';
export type { GoalState, GoalStoreType } from './stores/goalStore';

// ===== Router =====
export { goalRoutes } from './router';

// ===== Widgets =====
// export { registerGoalWidgets } from './widgets/registerGoalWidgets';

// ===== Initialization =====
export { registerGoalInitializationTasks } from './initialization';
