/**
 * Goal Infrastructure Client - Transport Types
 *
 * Transport-specific interfaces and re-exports of port interfaces.
 * Port interfaces moved to application-client/ports/.
 */

import type { IResultHttpClient } from '@dailyuse/http-client';

// ============ Transport Client Interfaces ============
// Module only defines what it needs — concrete implementations injected from App layer.

// IResultHttpClient imported from @dailyuse/http-client
export type { IResultHttpClient };

/**
 * IPC Client interface (Result-returning).
 * Canonical definition in @dailyuse/ipc-client (ResultIpcClient).
 */
export type { IResultIpcClient } from '@dailyuse/ipc-client';

// ============ Port Interface Re-exports ============
export type { IGoalApiClient } from '../../application-client/ports/goal-api-client.port';
export type { IGoalFolderApiClient } from '../../application-client/ports/goal-folder-api-client.port';
export type { IGoalFocusApiClient } from '../../application-client/ports/goal-focus-api-client.port';
