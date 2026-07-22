/**
 * Reminder Infrastructure Client - Transport Types
 *
 * Transport-specific interfaces and re-exports of port interfaces.
 * Port interfaces moved to application-client/ports/.
 */

// ============ Transport Client Interfaces ============

// IResultHttpClient imported from @dailyuse/http-client

/**
 * IPC Client interface (Result-returning).
 * Canonical definition in @dailyuse/ipc-client (ResultIpcClient).
 */
export type { IResultIpcClient } from '@dailyuse/ipc-client';

// ============ Port Interface Re-exports ============
export type { IReminderApiClient } from '../../application-client/ports/reminder-api-client.port';
