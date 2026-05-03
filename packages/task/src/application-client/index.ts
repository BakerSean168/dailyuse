/**
 * Task Application Module (Client)
 *
 * Constructor-injected application service for task management.
 * Uses Result<T> pattern for consistent error handling.
 */

// ===== Port Interfaces =====
export type { ITaskTemplateApiClient, TaskTemplateListParams } from './ports/task-template-api-client.port';
export type { ITaskInstanceApiClient } from './ports/task-instance-api-client.port';
export type { ITaskDependencyApiClient } from './ports/task-dependency-api-client.port';
export type { TaskClientPort } from './task-client.port';

// ===== Client Service =====
export { TaskClientService, createTaskClientService } from './task-client-service';
export * from './types/task-dag.types';
