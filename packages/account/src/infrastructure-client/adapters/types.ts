/**
 * Account Module - Adapter Types
 *
 * Local transport interfaces for dependency inversion.
 */

import type { IResultHttpClient } from '@dailyuse/http-client';

// Re-export the port interface from application-client
export type { IAccountApiClient } from '../../application-client';

// Re-export IResultHttpClient for adapter use
export type { IResultHttpClient };

/**
 * IPC Client interface - local abstraction over IPC transport (Electron)
 */
export interface IIpcClient {
  invoke<T>(channel: string, ...args: unknown[]): Promise<T>;
}
