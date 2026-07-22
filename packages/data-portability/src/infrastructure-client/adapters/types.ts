/**
 * Data Portability Infrastructure Client — Transport Types
 */

import type { IResultHttpClient } from '@dailyuse/http-client';

export type { IResultHttpClient };

/**
 * IPC Client interface (Result-returning).
 * Canonical definition in @dailyuse/ipc-client (ResultIpcClient).
 */
export type { IResultIpcClient } from '@dailyuse/ipc-client';

// ============ Port Interface Re-exports ============
export type { IDataPortabilityApiClient } from '../../application-client/ports/data-portability-api-client.port';
