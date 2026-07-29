/**
 * Data Portability Infrastructure Client — Transport Types
 */

import type { IResultHttpClient } from '@memoflow/http-client';

export type { IResultHttpClient };

/**
 * IPC Client interface (Result-returning).
 * Canonical definition in @memoflow/ipc-client (ResultIpcClient).
 */
export type { IResultIpcClient } from '@memoflow/ipc-client';

// ============ Port Interface Re-exports ============
export type { IDataPortabilityApiClient } from '../../application-client/ports/data-portability-api-client.port';
