/**
 * Goal Application Module (Client)
 *
 * Provides application services for goal management on the client side.
 * Framework-agnostic - can be used in Web or Desktop.
 *
 * Smart Container + Application Service Pattern:
 * - Import goalApplicationService for unified API
 * - Or use individual Use Cases for fine-grained control
 */

// Container
export { GoalContainer } from '@/infrastructure-client';

// ===== Data & Rules =====
export { BUILT_IN_TEMPLATES, getTemplatesByCategory, getTemplatesByRole, getTemplatesByIndustry, getTemplateById } from './GoalTemplates';
export { BUILT_IN_RULES, sortRulesByPriority, getEnabledRules, findRuleById, RULE_TEMPLATES } from './BuiltInRules';
export type { GoalTemplate, KeyResultTemplate } from './GoalTemplates';

// ===== Smart Container Pattern - RECOMMENDED =====
export { GoalApplicationService, goalApplicationService } from './goal-application.service';

// ===== Constructor-Injected Service (Result-based) =====
export { GoalClientService } from './goal-client-service';

// ===== Use Cases (for direct access if needed) =====
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
