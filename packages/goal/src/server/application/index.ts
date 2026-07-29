/**
 * Goal Application Module (Server)
 *
 * Provides services for goal management on the server side.
 * Each service orchestrates domain objects and repositories.
 *
 * 类型定义请从 @memoflow/contracts/goal 导入
 */

// ============================================================
// Services (按用例划分)
// ============================================================
export {
  // Goal Services
  CreateGoalUseCase,
  GetGoalUseCase,
  ListGoalsUseCase,
  UpdateGoalUseCase,
  DeleteGoalUseCase,
  ArchiveGoalUseCase,
  ArchiveExpiredGoalsUseCase,
  ActivateGoalUseCase,
  CompleteGoalUseCase,
  PermanentlyDeleteGoalUseCase,
  SearchGoalsUseCase,
  ActivateFocusModeUseCase,
  DeactivateFocusModeUseCase,
  ExtendFocusModeUseCase,
  // GoalFolder Services
  ListGoalFoldersUseCase,
  CreateGoalFolderUseCase,
  GetGoalFolderUseCase,
  UpdateGoalFolderUseCase,
  DeleteGoalFolderUseCase,
  // Key Result Services
  AddGoalKeyResultUseCase,
  UpdateGoalKeyResultUseCase,
  UpdateGoalKeyResultProgressUseCase,
  DeleteGoalKeyResultUseCase,
  // Review Services
  AddGoalReviewUseCase,
  ListGoalReviewsUseCase,
  UpdateGoalReviewUseCase,
  DeleteGoalReviewUseCase,
  // Record Services
  CreateGoalRecordUseCase,
  ListGoalRecordsUseCase,
  DeleteGoalRecordUseCase,
  // Focus Mode Services
  GetCurrentFocusModeUseCase,
  // Workflow Services
  GetGoalAggregateUseCase,
  GetGoalProgressBreakdownUseCase,
  CloneGoalUseCase,
  BatchUpdateKeyResultWeightsUseCase,
} from './use-cases';

// ============================================================
// Mappers
// ============================================================
export { GoalMapper } from './mappers';

// ============================================================
// Event Handlers
// ============================================================
export { registerGoalEventListeners } from './event-handlers';

// ============================================================
// Errors
// ============================================================
export * from './errors/weight-snapshot-errors';

export type { GoalApplicationPort } from './goal.application.port';
