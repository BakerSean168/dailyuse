/**
 * Repository Web Module
 * Re-exports from shared app-vue package + web-specific initialization
 */

// Store, Composables, Routes from app-vue
export {
  useRepositoryStore,
  type RepositoryStoreType,
  useRepository,
  repositoryRoutes,
} from '@dailyuse/app-vue';

// Initialization (web-specific, not yet wired up)
export { registerRepositoryInitializationTasks } from './initialization/repositoryInitialization';
