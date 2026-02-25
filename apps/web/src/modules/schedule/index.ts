/**
 * Schedule Web Module
 * Re-exports from shared app-vue package + web-specific initialization
 */

// Store, Composables, Routes from app-vue
export {
  useScheduleStore,
  type ScheduleStoreType,
  useSchedule,
  scheduleRoutes,
} from '@dailyuse/app-vue';

// Initialization (web-specific)
export { registerScheduleInitializationTasks } from './initialization/scheduleInitialization';
