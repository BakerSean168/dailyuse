/**
 * Goal Application Module (Client)
 *
 * Provides application services for goal management on the client side.
 * Framework-agnostic - can be used in Web or Desktop.
 */

// Container
export { GoalContainer } from '@dailyuse/infrastructure-client';

// Services
export {
  // Goal Management Use Cases
  CreateGoal,
  GetGoal,
  ListGoals,
  UpdateGoal,
  DeleteGoal,
  ActivateGoal,
  PauseGoal,
  CompleteGoal,
  ArchiveGoal,
  SearchGoals,
  GetGoalAggregateView,
  CloneGoal,
  
  // Key Result Use Cases
  CreateKeyResult,
  GetKeyResults,
  UpdateKeyResult,
  DeleteKeyResult,
  BatchUpdateKeyResultWeights,
  GetProgressBreakdown,
  GenerateKeyResults,
  
  // Task Decomposition (AI) Use Cases
  TaskDecompositionService,
  
  // Goal Record Use Cases
  CreateGoalRecord,
  GetGoalRecordsByKeyResult,
  GetGoalRecordsByGoal,
  DeleteGoalRecord,
  
  // Goal Review Use Cases
  CreateGoalReview,
  GetGoalReviews,
  UpdateGoalReview,
  DeleteGoalReview,
  
  // Goal Folder Use Cases
  CreateGoalFolder,
  ListGoalFolders,
  GetGoalFolder,
  UpdateGoalFolder,
  DeleteGoalFolder,
  
  // AI Services
  TaskTimeEstimationService,
  PriorityAnalysisService,
  type PriorityScore,
  type PriorityFactor,
  type PriorityBatchResult,
  type PriorityLevel,
  type EisenhowerQuadrant,
  
  // Focus Session Use Cases
  StartFocusSession,
  PauseFocusSession,
  ResumeFocusSession,
  StopFocusSession,
  GetFocusStatus,
  GetFocusHistory,
  GetFocusStatistics,
} from './services';
