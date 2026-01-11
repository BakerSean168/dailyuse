/**
 * Goal Services (Server)
 *
 * Server-side services for goal operations.
 * Each service represents a single business operation.
 *
 * Pattern:
 * - Each service is a class with a single `execute` method
 * - Dependencies are injected via constructor
 * - Returns DTOs, not domain objects
 * - 类型定义请从 @dailyuse/contracts/goal 导入
 */

// ============================================================
// Services
// ============================================================

export { CreateGoal } from './create-goal';
export { GetGoal } from './get-goal';
export { ListGoals } from './list-goals';
export { UpdateGoal } from './update-goal';
export { DeleteGoal } from './delete-goal';
export { ArchiveGoal } from './archive-goal';
export { ActivateGoal } from './activate-goal';
export { CompleteGoal } from './complete-goal';
export { SearchGoals } from './search-goals';

// ============================================================
// GoalFolder Services
// ============================================================

export { ListGoalFolders } from './list-goal-folders';
export { CreateGoalFolder } from './create-goal-folder';
export { GetGoalFolder } from './get-goal-folder';
export { UpdateGoalFolder } from './update-goal-folder';
export { DeleteGoalFolder } from './delete-goal-folder';

// ============================================================
// Legacy: GoalApplicationService (保留向后兼容)
// ============================================================

export {
  GoalApplicationService,
  createGoalApplicationService,
  type CreateGoalParams,
  type UpdateGoalParams,
} from './GoalApplicationService';

