/**
 * Task Application Module (Client)
 *
 * Constructor-injected application service for task management.
 * Uses Result<T> pattern for consistent error handling.
 */

export { TaskClientService } from './task-client-service';

// Re-export as taskApplicationService alias for backward compatibility
// The actual instance is created in the desktop module initialization
export { TaskClientService as TaskApplicationService } from './task-client-service';

// Singleton placeholder - will be replaced during module initialization
let _taskApplicationService: any = null;

export function setTaskApplicationService(service: any) {
  _taskApplicationService = service;
}

export const taskApplicationService: any = new Proxy({} as any, {
  get(_target, prop) {
    if (!_taskApplicationService) {
      throw new Error('taskApplicationService not initialized. Call setTaskApplicationService first.');
    }
    return (_taskApplicationService as any)[prop];
  }
});
