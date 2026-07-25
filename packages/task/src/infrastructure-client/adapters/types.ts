/**
 * Task Infrastructure Client - Transport Types
 *
 * Transport-specific interfaces and re-exports of port interfaces.
 * Port interfaces moved to application-client/ports/.
 */

// ============ Transport Client Interfaces ============
// Module only defines what it needs - concrete implementations injected from App layer.

/**
 * IPC Client interface (Result-returning).
 * Canonical definition in @dailyuse/ipc-client (ResultIpcClient).
 */
export type { IResultIpcClient } from '@dailyuse/ipc-client';

// ============ Port Interface Re-exports ============
export type { ITaskTemplateApiClient, TaskTemplateListParams } from '../../application-client/ports/task-template-api-client.port';
export type { ITaskInstanceApiClient } from '../../application-client/ports/task-instance-api-client.port';
export type { ITaskDependencyApiClient } from '../../application-client/ports/task-dependency-api-client.port';
