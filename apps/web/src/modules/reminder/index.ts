/**
 * Reminder Module Exports
 * DDD 架构分层导出
 */

// Initialization
export { registerReminderInitializationTasks } from './initialization';

// Presentation Layer - Composables
export { useReminder } from './presentation/composables/useReminder';

// Presentation Layer - Store
export { useReminderStore } from './presentation/stores/reminderStore';

// Presentation Layer - Views (Desktop Grid Style)
export { default as ReminderDesktopView } from './presentation/views/ReminderDesktopView.vue';
