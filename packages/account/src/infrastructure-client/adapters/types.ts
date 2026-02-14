/**
 * Account Module - Adapter Types
 *
 * Local transport interfaces for dependency inversion.
 * Modules define their own transport interfaces and accept injected implementations.
 */

import type { IHttpClient } from '@dailyuse/http-client';

// Re-export the port interface from application-client
export type { IAccountApiClient } from '../../application-client';

// IHttpClient imported from @dailyuse/http-client

/**
 * IPC Client interface - local abstraction over IPC transport (Electron)
 */
export interface IIpcClient {
  invoke<T>(channel: string, ...args: unknown[]): Promise<T>;
}
