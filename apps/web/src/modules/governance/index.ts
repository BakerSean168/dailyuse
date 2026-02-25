/**
 * Governance Web Module
 * Re-exports from shared app-vue package + web-specific initialization
 */

// Types, Store, Composables, Routes, Components from app-vue
export {
  useGovernanceStore,
  type GovernanceStoreType,
  useGovernance,
  usePerformanceMonitor,
  governanceRoutes,
} from '@dailyuse/app-vue';

// Types re-exported from contracts
export type * from './types';

// Widgets (web-specific)
export { registerGovernanceWidgets } from './presentation/widgets';
