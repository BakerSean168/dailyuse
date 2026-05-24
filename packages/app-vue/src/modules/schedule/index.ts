/**
 * Schedule Module - Public Exports
 *
 * @module modules/schedule
 */

// Store
export { useScheduleStore } from './stores/schedule-store';
export type { ScheduleStoreType } from './stores/schedule-store';

// Composables
export { useSchedule, useCalendarView } from './composables';
export type { CalendarEventItem } from './composables';

// Routes
export { scheduleRoutes } from './router';

// Components
export * from './components';
