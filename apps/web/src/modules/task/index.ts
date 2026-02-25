/**
 * Task Web Module
 * Re-exports from shared app-vue package + web-specific initialization
 */

// Store, Composables, Routes from app-vue
export { useTaskStore, type TaskStoreType, useTask, taskRoutes } from '@dailyuse/app-vue';

// Initialization (web-specific)
export { registerTaskInitializationTasks } from './initialization';
