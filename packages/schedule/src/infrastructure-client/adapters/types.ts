/**
 * Schedule Infrastructure Client - Port Interfaces
 *
 * Transport-agnostic interfaces for Schedule API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 *
 * Types imported from @memoflow/contracts/schedule.
 */

// Re-export port interfaces from application-client ports
export type { IScheduleEventApiClient } from '../../application-client/ports/schedule-event-api-client.port';
export type { IScheduleTaskApiClient } from '../../application-client/ports/schedule-task-api-client.port';

// ============ Transport Client Interfaces ============
// Module only defines what it needs — concrete implementations injected from App layer.

// IResultHttpClient imported from @memoflow/http-client

/**
 * IPC Client interface (Result-returning).
 * Canonical definition in @memoflow/ipc-client (ResultIpcClient).
 */
export type { IResultIpcClient } from '@memoflow/ipc-client';
