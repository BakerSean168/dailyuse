/**
 * Authentication Module - Adapter Types
 *
 * Local transport interfaces for dependency inversion.
 */

// Re-export the port interface from application-client
export type { IAuthApiClient } from '../../application-client';

/**
 * HTTP Client interface - local abstraction over HTTP transport
 */
export interface IHttpClient {
  get<T = any>(url: string, config?: { params?: any }): Promise<T>;
  post<T = any>(url: string, data?: any): Promise<T>;
  put<T = any>(url: string, data?: any): Promise<T>;
  delete<T = any>(url: string): Promise<T>;
}

/**
 * IPC Client interface - local abstraction over IPC transport (Electron)
 */
export interface IIpcClient {
  invoke<T>(channel: string, ...args: unknown[]): Promise<T>;
}
