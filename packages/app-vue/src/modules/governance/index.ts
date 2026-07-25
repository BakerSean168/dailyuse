/**
 * Governance Module - Public Exports
 *
 * @module modules/governance
 */

// Types
export type {
  RuleClientDTO,
  RuleRevisionClientDTO,
  RuleStatus,
  RuleSeverity,
  CreateRuleReq,
  UpdateRuleReq,
  ListRulesQuery,
  SearchRulesQuery,
} from '@dailyuse/contracts/governance';

// Store
export { useGovernanceStore } from './stores/governance-store';
export type { GovernanceStoreType } from './stores/governance-store';

// Composables
export { useGovernance } from './composables/useGovernance';
export { usePerformanceMonitor } from './composables/usePerformanceMonitor';

// Routes
export { governanceRoutes } from './router';

// Components
export * from './components';
