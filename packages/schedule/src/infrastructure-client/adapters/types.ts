/**
 * Schedule Infrastructure Client - Port Interfaces
 *
 * Transport-agnostic interfaces for Schedule API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 *
 * Types imported from @dailyuse/contracts/schedule.
 */

import type { Result } from '@dailyuse/contracts/result';

// Re-export port interfaces from application-client ports
export type { IScheduleEventApiClient } from '../../application-client/ports/schedule-event-api-client.port';
export type { IScheduleTaskApiClient } from '../../application-client/ports/schedule-task-api-client.port';

// ============ Transport Client Interfaces ============
// Module only defines what it needs — concrete implementations injected from App layer.

// IResultHttpClient imported from @dailyuse/http-client

/**
 * IPC Client interface (Result-returning).
 * Satisfied by ResultIpcClient from @dailyuse/ipc-client at the App level.
 */
export interface IResultIpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<Result<T>>;
}
