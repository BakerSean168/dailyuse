/**
 * Authentication Module - Adapter Types
 *
 * Local transport interfaces for dependency inversion.
 */

// Re-export the port interface from application-client
export type { IAuthApiClient } from '../../application-client';

/**
 * IPC Client interface - local abstraction over IPC transport (Electron)
 */
export interface IIpcClient {
  invoke<T>(channel: string, ...args: unknown[]): Promise<T>;
}
