/**
 * Repository Module - Public Exports
 *
 * Live surfaces: Local Vault (Desktop) and GitHub knowledge projections (Web).
 * Legacy database Repository/Resource editing is intentionally absent.
 *
 * @module modules/repository
 */

// Composables
export { useLocalVault } from './composables/useLocalVault';
export { useRecentKnowledgeNotes } from './composables/useRecentKnowledgeNotes';
export type { RecentKnowledgeNote } from './composables/useRecentKnowledgeNotes';

// Routes
export { repositoryRoutes } from './router';

// Components
export * from './components';
