/**
 * Task Application Module (Client)
 *
 * Constructor-injected application service for task management.
 * Uses Result<T> pattern for consistent error handling.
 */

// ===== Port Interfaces =====
export type {
  ITaskTemplateApiClient,
  ITaskInstanceApiClient,
  ITaskDependencyApiClient,
} from '../infrastructure-client/adapters/types';

export { TaskClientService } from './task-client-service';
export * from './types/task-dag.types';
