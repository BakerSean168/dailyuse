/**
 * Goal Application Module (Client)
 *
 * Constructor-injected application service for goal management.
 * Uses Result<T> pattern for consistent error handling.
 */

// ===== Data & Rules =====
export { BUILT_IN_TEMPLATES, getTemplatesByCategory, getTemplatesByRole, getTemplatesByIndustry, getTemplateById } from './GoalTemplates';
export { BUILT_IN_RULES, sortRulesByPriority, getEnabledRules, findRuleById, RULE_TEMPLATES } from './BuiltInRules';
export type { GoalTemplate, KeyResultTemplate } from './GoalTemplates';

// ===== Constructor-Injected Service (Result-based) =====
export { GoalClientService } from './goal-client-service';
