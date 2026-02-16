/**
 * Reminder Application Module (Client)
 *
 * Constructor-injected application service for reminder management.
 * Uses Result<T> pattern for consistent error handling.
 */

export { ReminderClientService } from './reminder-client-service';

// ===== Singleton Proxy =====
// Singleton placeholder - will be replaced during module initialization
let _reminderApplicationService: any = null;

export function setReminderApplicationService(service: any) {
  _reminderApplicationService = service;
}

export const reminderApplicationService: any = new Proxy({} as any, {
  get(_target, prop) {
    if (!_reminderApplicationService) {
      throw new Error('reminderApplicationService not initialized. Call setReminderApplicationService first.');
    }
    return (_reminderApplicationService as any)[prop];
  }
});
