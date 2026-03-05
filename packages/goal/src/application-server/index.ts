/**
 * Goal Application Module (Server)
 *
 * Provides services for goal management on the server side.
 * Each service orchestrates domain objects and repositories.
 *
 * 类型定义请从 @dailyuse/contracts/goal 导入
 */

// ============================================================
// Services (按用例划分)
// ============================================================
export {
  // Goal Services
  CreateGoal,
  GetGoal,
  ListGoals,
  UpdateGoal,
  DeleteGoal,
  ArchiveGoal,
  ActivateGoal,
  CompleteGoal,
  SearchGoals,
  // GoalFolder Services
  ListGoalFolders,
  CreateGoalFolder,
  GetGoalFolder,
  UpdateGoalFolder,
  DeleteGoalFolder,
  // Key Result Services
  AddGoalKeyResult,
  UpdateGoalKeyResult,
  UpdateGoalKeyResultProgress,
  DeleteGoalKeyResult,
  // Review Services
  AddGoalReview,
  ListGoalReviews,
  UpdateGoalReview,
  DeleteGoalReview,
  // Record Services
  CreateGoalRecord,
  ListGoalRecords,
  DeleteGoalRecord,
} from './use-cases';

// ============================================================
// Mappers
// ============================================================
export { GoalMapper, type GoalPersistenceDTO } from './mappers';

// ============================================================
// Event Handlers
// ============================================================
export { registerGoalEventListeners } from './event-handlers';

// ============================================================
// Errors
// ============================================================
export * from './errors/weight-snapshot-errors';
