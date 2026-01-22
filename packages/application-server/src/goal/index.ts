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
  // Legacy (向后兼容)
  GoalApplicationService,
  GoalKeyResultApplicationService,
} from './services';

// ============================================================
// Mappers
// ============================================================
export { GoalMapper, type GoalPersistenceDTO } from './mappers';

// ============================================================
// Event Handlers
// ============================================================
export { GOAL_EVENT_HANDLERS_PLACEHOLDER } from './event-handlers';

// ============================================================
// Errors
// ============================================================
export * from './errors/weight-snapshot-errors';
