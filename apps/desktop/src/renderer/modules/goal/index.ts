/**
 * Goal Module - Renderer
 *
 * 目标模块 - 渲染进程
 * 遵循 DDD 分层架构 + Smart Container Pattern (ADR-018)
 *
 * ✅ 直接导入 packages/application-client 的 ApplicationService
 * ❌ 不再保留本地 application/ 目录
 *
 * EPIC-015 重构: 移除本地 ApplicationService 重复代码
 */

// ===== Application Layer (from packages) =====
export { goalApplicationService } from '@dailyuse/application-client/goal';

// ===== Presentation Layer =====
export {
  useGoal,
  useGoalFolder,
  useKeyResult,
  useGoalReview,
  useFocus,
  type UseGoalReturn,
  type UseGoalFolderReturn,
} from './presentation/hooks';

export { useGoalStore, getGoalStore } from './presentation/stores/goalStore';
export type { GoalStore } from './presentation/stores/goalStore';

// ===== Initialization =====
export { registerGoalModule, initializeGoalModule } from './initialization';
