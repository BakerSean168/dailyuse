/**
 * Authentication Module - Adapter Types
 *
 * Local transport interfaces for dependency inversion.
 */

// Re-export the port interface from application-client
export type { IAuthApiClient } from '../../application-client';

/**
 * IPC Client interface (Result-returning).
 * Canonical definition in @memoflow/ipc-client (ResultIpcClient).
 */
export type { IResultIpcClient } from '@memoflow/ipc-client';
