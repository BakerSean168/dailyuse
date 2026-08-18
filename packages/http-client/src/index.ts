/**
 * @memoflow/http-client — unified HTTP client package
 *
 * Primary (only) path for first-party MemoFlow APIs:
 *
 * **ResultHttpClient** — `Promise<Result<T>>`, never throws
 * - Used by Web/Desktop DI and all module HTTP adapters
 * - Requires HttpResponse envelopes (no raw dual-track JSON)
 *
 * Throw-style AxiosHttpClient / IHttpClient dual-track removed (stage-6 residual 83).
 *
 * @module @memoflow/http-client
 *
 * @example
 * ```ts
 * import { createResultHttpClient } from '@memoflow/http-client';
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
  HttpClientConfig,
  TokenProvider,
  TokenRefreshHandler,
} from './types';
export { DEFAULT_HTTP_CLIENT_CONFIG } from './types';

// ── Clients ──
export { ResultHttpClient } from './result-http-client';

// ── Email verification session fuse ──
export {
  EMAIL_VERIFICATION_DOMAIN_CODE,
  EMAIL_VERIFICATION_MESSAGE_KEY,
  DEFAULT_EMAIL_VERIFICATION_HIT_BUDGET,
  canAttemptEmailVerificationSensitiveRequest,
  recordEmailVerificationRequired,
  buildEmailVerificationBlockedError,
  isEmailVerificationRequiredError,
  isEmailVerificationCircuitTripped,
  getEmailVerificationHitCount,
  resetEmailVerificationCircuit,
  getEmailVerificationCircuitSnapshot,
  resourceKeyFromUrl,
} from './email-verification-circuit';

// ── Result error helpers ──
export {
  classifyNetworkError,
  normalizeResultError,
  statusToResultCode,
  statusToResultError,
  translateResultErrorMessage,
} from './result-error';
export type {
  ResultErrorTranslateFn,
  TranslateResultErrorOptions,
  ResultErrorMessageKey,
} from './result-error';

// ── Factories ──
import type { HttpClientConfig } from './types';
import { ResultHttpClient } from './result-http-client';

/**
 * Create a ResultHttpClient (never throws; returns Result envelopes).
 */
export function createResultHttpClient(config?: HttpClientConfig): ResultHttpClient {
  return new ResultHttpClient(config);
}
