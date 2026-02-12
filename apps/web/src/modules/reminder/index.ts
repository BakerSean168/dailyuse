/**
 * Reminder Module - Public API
 */

// ===== Presentation Layer =====
export { useReminderStore } from './presentation/stores/reminderStore';
export type { ReminderStoreType } from './presentation/stores/reminderStore';
export { useReminder } from './presentation/composables/useReminder';

// Views
export { default as ReminderDesktopView } from './presentation/views/ReminderDesktopView.vue';

// Initialization
export { registerReminderInitializationTasks } from './initialization';
