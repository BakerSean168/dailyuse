/**
 * Goal Application Module (Client)
 *
 * Constructor-injected application service for goal management.
 * Uses Result<T> pattern for consistent error handling.
 */

// ===== Port Interfaces =====
export type { IGoalApiClient } from './ports/goal-api-client.port';
export type { IGoalFolderApiClient } from './ports/goal-folder-api-client.port';
export type { IGoalFocusApiClient } from './ports/goal-focus-api-client.port';

// ===== Data & Rules =====
export {
  BUILT_IN_TEMPLATES,
  getTemplatesByCategory,
  getTemplatesByRole,
  getTemplatesByIndustry,
  getTemplateById,
} from './GoalTemplates';
export {
  BUILT_IN_RULES,
  sortRulesByPriority,
  getEnabledRules,
  findRuleById,
  RULE_TEMPLATES,
} from './BuiltInRules';
export type { GoalTemplate, KeyResultTemplate } from './GoalTemplates';

// ===== Constructor-Injected Service (Result-based) =====
export { GoalClientService, createGoalClientService } from './goal-client-service';
export type { GoalClientPort } from './goal-client-service';
export { createGoalServiceFromHttpClient } from './goal-http-service-factory';
