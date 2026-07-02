/**
 * @dailyuse/http-client — 统一 HTTP 客户端包
 *
 * 提供两种风格的 HTTP 客户端，满足不同使用场景：
 *
 * 1. **AxiosHttpClient** — 实现 `HttpClient` (IHttpClient) 接口
 *    - 返回 `Promise<T>`，与现有 DI 体系完全兼容
 *    - 用于所有已有的 HTTP Adapter（GoalHttpAdapter、TaskHttpAdapter 等）
 *    - 出错时抛出 `HttpClientError`
 *
 * 2. **ResultHttpClient** — 返回 `Promise<Result<T>>`
 *    - 永不抛出异常，所有错误转化为 `Result.fail`
 *    - 适合新代码、Vue Composables 中直接使用
 *    - 无需 try-catch
 *
 * @module @dailyuse/http-client
 *
 * @example
 * ```ts
 * // ── 方式 1: 与现有 DI 体系集成 ──
 * import { AxiosHttpClient, type IHttpClient } from '@dailyuse/http-client';
 *
 * const httpClient: IHttpClient = new AxiosHttpClient({
 *   baseURL: '/api/v1',
 *   tokenProvider: { getAccessToken: () => authStore.token },
 * });
 *
 * // ── 方式 2: 新代码直接使用 ResultHttpClient ──
 * import { createResultHttpClient } from '@dailyuse/http-client';
 *
 * const api = createResultHttpClient({ baseURL: '/api/v1' });
 * const result = await api.get<User[]>('/users');
 *
 * if (result.ok) {
 *   console.log(result.data); // User[]
 * } else {
 *   console.error(result.error.message); // 无需 try-catch
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

// ── Axios Instance Factory ──
export { createAxiosInstance } from './axios-instance';

// ── IHttpClient 实现（兼容现有 DI）──
export { AxiosHttpClient, HttpClientError } from './axios-http-client';

// ── Result HTTP Client（新代码推荐）──
export { ResultHttpClient } from './result-http-client';
export {
  classifyNetworkErrorMessage,
  getDefaultResultErrorMessage,
  normalizeResultError,
  resolveResultErrorCodeFallback,
  statusToResultCode,
  statusToResultError,
  translateResultErrorMessage,
} from './result-error';
export type {
  ResultErrorMessageKey,
  ResultErrorTranslateFn,
  TranslateResultErrorOptions,
} from './result-error';

// ── 便捷工厂函数 ──
import type { AxiosHttpClientConfig } from './types';
import { AxiosHttpClient } from './axios-http-client';
import { ResultHttpClient } from './result-http-client';

/**
 * 创建 AxiosHttpClient 实例
 *
 * 工厂函数，等价于 `new AxiosHttpClient(config)`。
 * 返回的实例实现了 `IHttpClient` 接口，可直接传入
 * `configureWebDependencies()`。
 */
export function createHttpClient(config?: AxiosHttpClientConfig): AxiosHttpClient {
  return new AxiosHttpClient(config);
}

/**
 * 创建 ResultHttpClient 实例
 *
 * 工厂函数，等价于 `new ResultHttpClient(config)`。
 * 返回的实例所有方法都返回 `Promise<Result<T>>`，永不抛出异常。
 */
export function createResultHttpClient(config?: AxiosHttpClientConfig): ResultHttpClient {
  return new ResultHttpClient(config);
}
