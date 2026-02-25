/**
 * Reminder Web Module
 * Re-exports from shared app-vue package + web-specific initialization
 */

// Store, Composables, Routes from app-vue
export {
  useReminderStore,
  type ReminderStoreType,
  useReminder,
  reminderRoutes,
} from '@dailyuse/app-vue';

// Initialization (web-specific)
export { registerReminderInitializationTasks } from './initialization';
