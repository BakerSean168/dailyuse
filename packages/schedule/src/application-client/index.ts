/**
 * Schedule Application Module (Client)
 *
 * Constructor-injected application service for schedule management.
 * Uses Result<T> pattern for consistent error handling.
 */

// ===== Port Interfaces =====
export type { IScheduleEventApiClient } from './ports/schedule-event-api-client.port';
export type { IScheduleTaskApiClient } from './ports/schedule-task-api-client.port';
export type { ScheduleClientPort } from './schedule-client.port';

// ===== Client Service =====
export { ScheduleClientService, createScheduleClientService } from './schedule-client-service';
