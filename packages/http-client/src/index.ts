/**
 * @dailyuse/http-client — unified HTTP client package
 *
 * Primary path for first-party Memoflow APIs:
 *
 * 1. **ResultHttpClient** — `Promise<Result<T>>`, never throws
 *    - Used by Web/Desktop DI and all module HTTP adapters
 *    - Requires HttpResponse envelopes (no raw dual-track JSON)
 *
 * 2. **AxiosHttpClient** — throw-style `Promise<T>` twin
 *    - Also requires HttpResponse envelopes for JSON success bodies
 *    - Non-JSON download payloads (blob/arraybuffer/text) may pass through
 *
 * @module @dailyuse/http-client
 *
 * @example
 * ```ts
 * import { createResultHttpClient } from '@dailyuse/http-client';
 *
 * const api = createResultHttpClient({ baseURL: '/api/v1' });
 * const result = await api.get<User[]>('/users');
 *
 * if (result.ok) {
 *   console.log(result.data); // User[]
 * } else {
 *   console.error(result.error.message);
 * }
 * ```
 */

// ── Types ──
export type {
  HttpClient,
  IHttpClient,
  IResultHttpClient,
  HttpRequestOptions,
  HttpClientConfig,
  AxiosHttpClientConfig,
  TokenProvider,
  TokenRefreshHandler,
} from './types';
export { DEFAULT_HTTP_CLIENT_CONFIG } from './types';

// ── Errors ──
export { HttpClientError } from './axios-http-client';

// ── Clients ──
export { AxiosHttpClient } from './axios-http-client';
export { ResultHttpClient } from './result-http-client';

// ── Result error helpers ──
export {
  classifyNetworkErrorMessage,
  statusToResultCode,
  statusToResultError,
} from './result-error';

// ── Factories ──
import type { AxiosHttpClientConfig } from './types';
import { AxiosHttpClient } from './axios-http-client';
import { ResultHttpClient } from './result-http-client';

/**
 * Create an AxiosHttpClient (throw-style Promise<T>).
 */
export function createHttpClient(config?: AxiosHttpClientConfig): AxiosHttpClient {
  return new AxiosHttpClient(config);
}

/**
 * Create a ResultHttpClient (never throws; returns Result envelopes).
 */
export function createResultHttpClient(config?: AxiosHttpClientConfig): ResultHttpClient {
  return new ResultHttpClient(config);
}
