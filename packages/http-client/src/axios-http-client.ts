/**
 * Axios HTTP Client — 实现 IHttpClient 接口
 *
 * 对接 Hexagonal Architecture 适配层。
 * 所有 HTTP Adapters（GoalHttpAdapter、TaskHttpAdapter 等）
 * 依赖 `IHttpClient` 接口，本类即为其 Axios 实现。
 *
 * 职责：
 * - 将 Axios 响应中的后端 HttpResponse<T> 信封自动剥离，返回纯业务数据 T
 * - 将 HTTP 错误 / 网络异常转化为明确的 HttpClientError
 * - 支持 401 自动 Token 刷新 + 重试（可选）
 *
 * @module @dailyuse/http-client
 */

import type { AxiosInstance, AxiosResponse, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import type { HttpResponse } from '@dailyuse/contracts/result';
import type { HttpClient, HttpRequestOptions, AxiosHttpClientConfig, TokenRefreshHandler } from './types';
import { createAxiosInstance } from './axios-instance';

// ============================================================================
// HttpClientError
// ============================================================================

/**
 * HTTP 客户端错误
 *
 * 当后端返回 `ok: false` 或发生网络异常时抛出，
 * 让上层（Store / Composable）可以按需 try-catch。
 */
export class HttpClientError extends Error {
  constructor(
    message: string,
    /** 后端错误码（如 'NOT_FOUND', 'UNAUTHORIZED'）或空字符串 */
    public readonly code: string,
    /** HTTP 状态码（网络异常时为 0） */
    public readonly status: number,
    /** 后端返回的完整错误详情 */
    public readonly details?: unknown,
    /** 原始错误对象 */
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'HttpClientError';
  }
}

// ============================================================================
// AxiosHttpClient
// ============================================================================

/**
 * Axios HTTP 客户端 — 实现 IHttpClient
 *
 * 专为 DI 体系（`configureWebDependencies(httpClient)`）设计。
 * 签名与 `HttpClient` 接口保持一致：`Promise<T>`（不返回 Result）。
 *
 * @example
 * ```ts
 * import { AxiosHttpClient } from '@dailyuse/http-client';
 *
 * const httpClient = new AxiosHttpClient({
 *   baseURL: '/api/v1',
 *   tokenProvider: { getAccessToken: () => authStore.token },
 *   onUnauthorized: () => router.push('/login'),
 * });
 *
 * configureWebDependencies(httpClient);
 * ```
 */
export class AxiosHttpClient implements HttpClient {
  private readonly axios: AxiosInstance;
  private readonly onTokenRefresh?: TokenRefreshHandler;
  private readonly onUnauthorized?: () => void;
  private readonly enableLogging: boolean;

  /** 是否正在刷新 Token（防止并发刷新） */
  private isRefreshing = false;
  /** 排队等待 Token 刷新的请求 */
  private refreshQueue: Array<{
    resolve: (token: string) => void;
    reject: (err: unknown) => void;
  }> = [];

  constructor(config: AxiosHttpClientConfig = {}) {
    this.axios = createAxiosInstance(config);
    this.onTokenRefresh = config.onTokenRefresh;
    this.onUnauthorized = config.onUnauthorized;
    this.enableLogging = config.enableLogging ?? false;

    this.setupResponseInterceptor();
  }

  // ────────────────────────────────────────
  // IHttpClient 实现
  // ────────────────────────────────────────

  async get<T>(url: string, options?: HttpRequestOptions): Promise<T> {
    const response = await this.axios.get<T>(url, this.toAxiosConfig(options));
    // 拦截器已经将 AxiosResponse 映射为 T
    return response as unknown as T;
  }

  async post<T>(url: string, data?: unknown, options?: HttpRequestOptions): Promise<T> {
    const response = await this.axios.post<T>(url, data, this.toAxiosConfig(options));
    return response as unknown as T;
  }

  async put<T>(url: string, data?: unknown, options?: HttpRequestOptions): Promise<T> {
    const response = await this.axios.put<T>(url, data, this.toAxiosConfig(options));
    return response as unknown as T;
  }

  async patch<T>(url: string, data?: unknown, options?: HttpRequestOptions): Promise<T> {
    const response = await this.axios.patch<T>(url, data, this.toAxiosConfig(options));
    return response as unknown as T;
  }

  async delete<T>(url: string, options?: HttpRequestOptions): Promise<T> {
    const response = await this.axios.delete<T>(url, this.toAxiosConfig(options));
    return response as unknown as T;
  }

  // ────────────────────────────────────────
  // 获取底层实例（高级场景）
  // ────────────────────────────────────────

  /** 获取底层 Axios 实例（上传、流式请求等特殊场景使用） */
  getAxiosInstance(): AxiosInstance {
    return this.axios;
  }

  // ────────────────────────────────────────
  // Private
  // ────────────────────────────────────────

  /**
   * HttpRequestOptions → AxiosRequestConfig
   */
  private toAxiosConfig(options?: HttpRequestOptions): AxiosRequestConfig | undefined {
    if (!options) return undefined;
    return {
      params: options.params,
      headers: options.headers,
    };
  }

  /**
   * 注册响应拦截器
   *
   * - 成功（2xx）：剥离 HttpResponse 信封，返回业务数据
   * - 失败（4xx/5xx/网络异常）：转化为 HttpClientError
   * - 401 特殊处理：尝试自动刷新 Token 后重试
   */
  private setupResponseInterceptor(): void {
    this.axios.interceptors.response.use(
      // ── 成功 (HTTP 2xx) ──
      (response: AxiosResponse) => {
        const data = response.data;

        if (this.enableLogging) {
          console.debug(`[HTTP] ← ${response.status} ${response.config.url ?? ''}`);
        }

        // 如果后端返回标准 HttpResponse 信封 → 剥离
        if (this.isHttpResponseEnvelope(data)) {
          if (data.ok) {
            // 返回业务数据（拦截器修改了返回值，Axios 类型已失效，靠 Client 方法矫正）
            return data.data as any;
          }
          // 后端显式返回了 ok: false（例如业务异常但 HTTP 200）
          throw new HttpClientError(
            data.error?.message ?? data.message ?? '请求失败',
            data.error?.code ?? 'BUSINESS_ERROR',
            response.status,
            data.error?.details,
          );
        }

        // 非标准信封（例如第三方接口、文件下载）→ 原样返回
        return data;
      },

      // ── 失败 (HTTP != 2xx | 网络异常) ──
      async (error: any) => {
        const { response, config: originalConfig, message } = error;

        // ✦ 401 自动刷新 Token + 重试
        if (response?.status === 401 && this.onTokenRefresh && !originalConfig._retried) {
          return this.handleTokenRefresh(originalConfig);
        }

        // ✦ 有 HTTP 响应 (4xx / 5xx)
        if (response) {
          const errorData = response.data;

          // 尝试从响应体提取后端标准错误信息
          if (this.isHttpResponseEnvelope(errorData) && !errorData.ok) {
            throw new HttpClientError(
              errorData.error?.message ?? errorData.message ?? '请求失败',
              errorData.error?.code ?? 'UNKNOWN',
              response.status,
              errorData.error?.details,
            );
          }

          // 非标准格式 → 兜底处理
          throw new HttpClientError(
            this.getDefaultErrorMessage(response.status),
            this.getDefaultErrorCode(response.status),
            response.status,
            errorData,
            error,
          );
        }

        // ✦ 网络异常 (断网 / DNS 失败 / 超时无响应)
        throw this.createNetworkError(message, error);
      },
    );
  }

  /**
   * 处理 401 自动刷新 Token
   */
  private async handleTokenRefresh(originalConfig: InternalAxiosRequestConfig & { _retried?: boolean }): Promise<any> {
    if (this.isRefreshing) {
      // 已在刷新中 → 排队等待
      return new Promise((resolve, reject) => {
        this.refreshQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalConfig.headers.Authorization = `Bearer ${newToken}`;
        return this.axios.request(originalConfig);
      });
    }

    this.isRefreshing = true;
    originalConfig._retried = true;

    try {
      const newToken = await this.onTokenRefresh!();

      if (!newToken) {
        // 刷新失败 → 通知登出
        this.drainRefreshQueue(new Error('Token 刷新失败'));
        this.onUnauthorized?.();
        throw new HttpClientError('登录已过期，请重新登录', 'UNAUTHORIZED', 401);
      }

      // 刷新成功 → 重试原请求 + 放行排队请求
      originalConfig.headers.Authorization = `Bearer ${newToken}`;
      this.drainRefreshQueue(null, newToken);
      return this.axios.request(originalConfig);
    } catch (refreshError) {
      this.drainRefreshQueue(refreshError);
      this.onUnauthorized?.();
      throw new HttpClientError('登录已过期，请重新登录', 'UNAUTHORIZED', 401, undefined, refreshError);
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * 清空刷新队列
   */
  private drainRefreshQueue(error: unknown, token?: string): void {
    for (const pending of this.refreshQueue) {
      if (error) {
        pending.reject(error);
      } else {
        pending.resolve(token!);
      }
    }
    this.refreshQueue = [];
  }

  // ────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────

  /** 判断是否为后端标准 HttpResponse 信封 */
  private isHttpResponseEnvelope(data: unknown): data is HttpResponse {
    return (
      data !== null &&
      typeof data === 'object' &&
      'ok' in (data as any) &&
      typeof (data as any).ok === 'boolean'
    );
  }

  /** 根据 HTTP 状态码获取默认错误消息 */
  private getDefaultErrorMessage(status: number): string {
    const messages: Record<number, string> = {
      400: '请求参数错误',
      401: '未授权，请登录',
      403: '拒绝访问',
      404: '资源不存在',
      408: '请求超时',
      409: '资源冲突',
      422: '参数验证失败',
      429: '请求过于频繁',
      500: '服务器内部错误',
      502: '网关错误',
      503: '服务不可用',
      504: '网关超时',
    };
    return messages[status] ?? `请求失败 (HTTP ${status})`;
  }

  /** 根据 HTTP 状态码获取默认 ResultCode */
  private getDefaultErrorCode(status: number): string {
    const codes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      408: 'TIMEOUT',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'RATE_LIMITED',
      500: 'INTERNAL_ERROR',
      502: 'SERVICE_UNAVAILABLE',
      503: 'SERVICE_UNAVAILABLE',
      504: 'TIMEOUT',
    };
    return codes[status] ?? 'UNKNOWN';
  }

  /** 创建网络异常错误 */
  private createNetworkError(message: string, cause: unknown): HttpClientError {
    if (message?.includes('timeout')) {
      return new HttpClientError('网络请求超时', 'TIMEOUT', 0, undefined, cause);
    }
    if (message?.includes('Network Error') || message?.includes('ERR_NETWORK')) {
      return new HttpClientError('网络连接断开', 'SERVICE_UNAVAILABLE', 0, undefined, cause);
    }
    if (message?.includes('canceled') || message?.includes('aborted')) {
      return new HttpClientError('请求已取消', 'UNKNOWN', 0, undefined, cause);
    }
    return new HttpClientError('网络连接异常', 'INTERNAL_ERROR', 0, undefined, cause);
  }
}
