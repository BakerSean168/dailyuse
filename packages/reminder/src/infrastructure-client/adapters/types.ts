/**
 * Reminder Infrastructure Client - Transport Types
 *
 * Transport-specific interfaces and re-exports of port interfaces.
 * Port interfaces moved to application-client/ports/.
 */

import type { Result } from '@dailyuse/contracts/result';

// ============ Transport Client Interfaces ============

// IResultHttpClient imported from @dailyuse/http-client

export interface IResultIpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<Result<T>>;
}

// ============ Port Interface Re-exports ============
export type { IReminderApiClient } from '../../application-client/ports/reminder-api-client.port';
