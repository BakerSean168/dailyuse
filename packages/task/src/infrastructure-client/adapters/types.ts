/**
 * Task Infrastructure Client - Transport Types
 *
 * Transport-specific interfaces and re-exports of port interfaces.
 * Port interfaces moved to application-client/ports/.
 */

import type { Result } from '@dailyuse/contracts/result';

// ============ Transport Client Interfaces ============
// Module only defines what it needs - concrete implementations injected from App layer.

/**
 * IPC Client interface (Result-returning).
 * Satisfied by ResultIpcClient from @dailyuse/ipc-client at the App level.
 */
export interface IResultIpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<Result<T>>;
}

// ============ Port Interface Re-exports ============
export type { ITaskTemplateApiClient, TaskTemplateListParams } from '../../application-client/ports/task-template-api-client.port';
export type { ITaskInstanceApiClient } from '../../application-client/ports/task-instance-api-client.port';
export type { ITaskDependencyApiClient } from '../../application-client/ports/task-dependency-api-client.port';
