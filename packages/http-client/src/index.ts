/**
 * @dailyuse/http-client — unified HTTP client package
 *
 * Primary (only) path for first-party Memoflow APIs:
 *
 * **ResultHttpClient** — `Promise<Result<T>>`, never throws
 * - Used by Web/Desktop DI and all module HTTP adapters
 * - Requires HttpResponse envelopes (no raw dual-track JSON)
 *
 * Throw-style AxiosHttpClient / IHttpClient dual-track removed (stage-6 residual 83).
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
  IResultHttpClient,
  HttpRequestOptions,
  AxiosHttpClientConfig,
  TokenProvider,
  TokenRefreshHandler,
} from './types';
export { DEFAULT_HTTP_CLIENT_CONFIG } from './types';

// ── Clients ──
export { ResultHttpClient } from './result-http-client';

// ── Result error helpers ──
export {
  classifyNetworkErrorMessage,
  statusToResultCode,
  statusToResultError,
} from './result-error';

// ── Factories ──
import type { AxiosHttpClientConfig } from './types';
import { ResultHttpClient } from './result-http-client';

/**
 * Create a ResultHttpClient (never throws; returns Result envelopes).
 */
export function createResultHttpClient(config?: AxiosHttpClientConfig): ResultHttpClient {
  return new ResultHttpClient(config);
}
