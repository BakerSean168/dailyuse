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

// ===== Singleton Proxy =====
// Singleton placeholder - will be replaced during module initialization
let _goalApplicationService: any = null;

export function setGoalApplicationService(service: any) {
  _goalApplicationService = service;
}

export const goalApplicationService: any = new Proxy({} as any, {
  get(_target, prop) {
    if (!_goalApplicationService) {
      throw new Error('goalApplicationService not initialized. Call setGoalApplicationService first.');
    }
    return (_goalApplicationService as any)[prop];
  }
});
