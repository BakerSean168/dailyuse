/**
 * Governance Module - Public Exports
 *
 * @module modules/governance
 */

// Types
export type * from './types';

// Store
export { useGovernanceStore } from './stores/governanceStore';
export type { GovernanceStoreType } from './stores/governanceStore';

// Composables
export { useGovernance } from './composables/useGovernance';
export { usePerformanceMonitor } from './composables/use-performance-monitor';

// Routes
export { governanceRoutes } from './router';

// Components
export * from './components';
