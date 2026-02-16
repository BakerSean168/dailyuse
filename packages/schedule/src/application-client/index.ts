/**
 * Schedule Application Module (Client)
 *
 * Constructor-injected application service for schedule management.
 * Uses Result<T> pattern for consistent error handling.
 */

export { ScheduleClientService } from './schedule-client-service';

// ===== Singleton Proxy =====
// Singleton placeholder - will be replaced during module initialization
let _scheduleApplicationService: any = null;

export function setScheduleApplicationService(service: any) {
  _scheduleApplicationService = service;
}

export const scheduleApplicationService: any = new Proxy({} as any, {
  get(_target, prop) {
    if (!_scheduleApplicationService) {
      throw new Error('scheduleApplicationService not initialized. Call setScheduleApplicationService first.');
    }
    return (_scheduleApplicationService as any)[prop];
  }
});
