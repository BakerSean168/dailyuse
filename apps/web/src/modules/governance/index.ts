/**
 * Governance Web Module
 */

// Types
export type * from './types';

// Store
export { useGovernanceStore } from './presentation/stores/governanceStore';
export type { GovernanceStoreType } from './presentation/stores/governanceStore';

// Composables
export { useGovernance } from './presentation/composables/useGovernance';

// Routes
export { governanceRoutes } from './presentation/router';

// Widgets
export { registerGovernanceWidgets } from './presentation/widgets';
