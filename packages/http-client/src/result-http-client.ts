/**
 * Result HTTP Client — 返回 Result<T>，永不抛出异常
 *
 * 业务层只感知 `Result<T>`，无需 try-catch。
 *
 * 设计原则：
 * 1. 统一返回 `Promise<Result<T>>`，不 reject
 * 2. HTTP 4xx/5xx / 网络异常 → `Result.fail`
 * 3. 成功响应 → 自动剥离 HttpResponse 信封 → `Result.ok(data)`
 * 4. 泛型安全，IDE 可精确推断 data 类型
 * 5. 401 自动 Token 刷新 + 登出处理
 *
 * @module @dailyuse/http-client
 *
 * @example
 * ```ts
 * const result = await resultClient.get<User[]>('/users');
 *
 * if (result.ok) {
 *   console.log(result.data);  // User[]
 * } else {
 *   console.error(result.error.message); // 永远不需要 try-catch
 * }
 * ```
 */

import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { Result, ResultError } from '@dailyuse/contracts/result';
import { ok, fail, ResultCode, fromHttpResponse } from '@dailyuse/contracts/result';
import type { HttpResponse } from '@dailyuse/contracts/result';
import type { AxiosHttpClientConfig, TokenRefreshHandler } from './types';
import { createAxiosInstance } from './axios-instance';

// ============================================================================
// ResultHttpClient
// ============================================================================

/**
 * Result HTTP Client
 *
 * 所有方法返回 `Promise<Result<T>>`，**永不抛出异常**。
 * 无论是 HTTP 错误、网络断开还是超时，都统一为 `Result.fail`。
 *
 * 支持 401 自动 Token 刷新和登出回调。
 *
 * @example
 * ```ts
 * const client = new ResultHttpClient({
 *   baseURL: '/api/v1',
 *   tokenProvider: { getAccessToken: () => authStore.token },
 *   onTokenRefresh: async () => { ... },
 *   onUnauthorized: () => { ... },
 * });
 *
 * // 在 Store 或 Composable 中
 * const result = await client.post<CreateGoalRes>('/goals', formData);
 *
 * if (result.ok) {
 *   // TS 自动推断 result.data 是 CreateGoalRes
 *   toast.success('创建成功');
 * } else {
 *   // 无论 401、500 还是断网都走这里
 *   toast.error(result.error.message); // "网络请求超时" | "参数错误" | ...
 * }
 * ```
 */
export class ResultHttpClient {
  private readonly axios: AxiosInstance;
  private readonly enableLogging: boolean;
  private readonly onTokenRefresh?: TokenRefreshHandler;
  private readonly onUnauthorized?: () => void;

  /** 是否正在刷新 Token（防止并发刷新） */
  private isRefreshing = false;
  /** 排队等待 Token 刷新的请求 */
  private refreshQueue: Array<{
    resolve: (token: string) => void;
    reject: (err: unknown) => void;
  }> = [];

  constructor(config: AxiosHttpClientConfig = {}) {
    this.axios = createAxiosInstance(config);
    this.enableLogging = config.enableLogging ?? false;
    this.onTokenRefresh = config.onTokenRefresh;
    this.onUnauthorized = config.onUnauthorized;
    
    // 设置 401 响应拦截器
    this.setupResponseInterceptor();
  }

  // ────────────────────────────────────────
  // Public API
  // ────────────────────────────────────────

  /**
   * 通用请求 — 返回 Result<T>
   */
  async request<T = unknown>(config: AxiosRequestConfig): Promise<Result<T>> {
    return this.execute<T>(() => this.axios.request(config));
  }

  /**
   * GET 请求
   * @param url - 路径（相对于 baseURL）
   * @param config - 可选的 Axios 配置（params、headers 等）
   */
  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<Result<T>> {
    return this.execute<T>(() => this.axios.get(url, config));
  }

  /**
   * POST 请求
   */
  async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<Result<T>> {
    return this.execute<T>(() => this.axios.post(url, data, config));
  }

  /**
   * PUT 请求
   */
  async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<Result<T>> {
    return this.execute<T>(() => this.axios.put(url, data, config));
  }

  /**
   * PATCH 请求
   */
  async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<Result<T>> {
    return this.execute<T>(() => this.axios.patch(url, data, config));
  }

  /**
   * DELETE 请求
   */
  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<Result<T>> {
    return this.execute<T>(() => this.axios.delete(url, config));
  }

  // ────────────────────────────────────────
  // 获取底层实例（高级场景）
  // ────────────────────────────────────────

  /** 获取底层 Axios 实例 */
  getAxiosInstance(): AxiosInstance {
    return this.axios;
  }

  // ────────────────────────────────────────
  // 响应拦截器 — 401 Token 刷新处理
  // ────────────────────────────────────────

  /**
   * 设置 401 响应拦截器
   * 
   * 当收到 401 时，尝试用 refreshToken 刷新 accessToken
   * 如果刷新成功，重试原请求
   * 如果刷新失败，调用 onUnauthorized 回调（通常用于导航到登录页）
   */
  private setupResponseInterceptor(): void {
    this.axios.interceptors.response.use(
      (response) => response,
      async (error: any) => {
        const { response, config: originalConfig } = error;

        // 401 自动刷新 Token + 重试
        if (response?.status === 401 && this.onTokenRefresh && !originalConfig._retried) {
          return this.handleTokenRefresh(originalConfig);
        }

        // 其他错误直接抛出，交给 execute 方法的 catch 处理
        return Promise.reject(error);
      }
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
        return Promise.reject(new Error('Token 刷新失败'));
      }

      // 刷新成功 → 重试原请求 + 放行排队请求
      originalConfig.headers.Authorization = `Bearer ${newToken}`;
      this.drainRefreshQueue(null, newToken);
      return this.axios.request(originalConfig);
    } catch (refreshError) {
      this.drainRefreshQueue(refreshError);
      this.onUnauthorized?.();
      return Promise.reject(refreshError);
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
  // Private — 核心执行逻辑
  // ────────────────────────────────────────

  /**
   * 统一执行入口
   *
   * 所有请求都经过这里：
   * 1. 调用 axios（可能成功 / 失败）
   * 2. 成功 → 解析响应 → ok(data)
   * 3. 失败 → 分类错误 → fail(error)
   * 4. **永远 resolve**，不 reject
   */
  private async execute<T>(requestFn: () => Promise<AxiosResponse>): Promise<Result<T>> {
    try {
      const response = await requestFn();

      if (this.enableLogging) {
        console.debug(`[HTTP] ← ${response.status} ${response.config.url ?? ''}`);
      }

      return this.handleSuccess<T>(response);
    } catch (error: any) {
      return this.handleError<T>(error);
    }
  }

  /**
   * 处理成功响应（HTTP 2xx）
   */
  private handleSuccess<T>(response: AxiosResponse): Result<T> {
    const data = response.data;

    // 后端返回了标准 HttpResponse 信封
    if (this.isHttpResponseEnvelope(data)) {
      // 利用 contracts 中已有的 fromHttpResponse 进行转换
      return fromHttpResponse<T>(data as HttpResponse<T>);
    }

    // 非标准信封 → 直接包装为 Result.ok
    return ok(data as T);
  }

  /**
   * 处理失败响应（HTTP != 2xx | 网络异常）
   *
   * 🌟 核心：返回 Result.fail 而非 throw/reject
   */
  private handleError<T>(error: any): Result<T> {
    const { response, message } = error;

    // ── A. 有 HTTP 响应 (4xx / 5xx) ──
    if (response) {
      const errorData = response.data;

      // A1. 后端返回了标准 HttpResponse 信封
      if (this.isHttpResponseEnvelope(errorData)) {
        return fromHttpResponse<T>(errorData as HttpResponse<T>);
      }

      // A2. 非标准格式 → 根据 HTTP 状态码构造
      return fail<ResultError>({
        code: this.statusToResultCode(response.status),
        message: this.statusToMessage(response.status, message),
        cause: error,
      }) as Result<T>;
    }

    // ── B. 网络异常 (断网 / DNS / 超时) ──
    return this.createNetworkFailure<T>(message, error);
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

  /** HTTP 状态码 → ResultCode */
  private statusToResultCode(status: number): string {
    const map: Record<number, string> = {
      400: ResultCode.BAD_REQUEST,
      401: ResultCode.UNAUTHORIZED,
      403: ResultCode.FORBIDDEN,
      404: ResultCode.NOT_FOUND,
      408: ResultCode.TIMEOUT,
      409: ResultCode.CONFLICT,
      422: ResultCode.VALIDATION_ERROR,
      429: ResultCode.RATE_LIMITED,
      500: ResultCode.INTERNAL_ERROR,
      502: ResultCode.SERVICE_UNAVAILABLE,
      503: ResultCode.SERVICE_UNAVAILABLE,
      504: ResultCode.TIMEOUT,
    };
    return map[status] ?? ResultCode.UNKNOWN;
  }

  /** HTTP 状态码 → 用户友好消息 */
  private statusToMessage(status: number, fallback?: string): string {
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
    return messages[status] ?? fallback ?? `请求失败 (HTTP ${status})`;
  }

  /** 创建网络异常的 Result.fail */
  private createNetworkFailure<T>(message: string, cause: unknown): Result<T> {
    if (message?.includes('timeout')) {
      return fail<ResultError>({
        code: ResultCode.TIMEOUT,
        message: '网络请求超时',
        cause,
      }) as Result<T>;
    }

    if (message?.includes('Network Error') || message?.includes('ERR_NETWORK')) {
      return fail<ResultError>({
        code: ResultCode.SERVICE_UNAVAILABLE,
        message: '网络连接断开',
        cause,
      }) as Result<T>;
    }

    if (message?.includes('canceled') || message?.includes('aborted')) {
      return fail<ResultError>({
        code: ResultCode.UNKNOWN,
        message: '请求已取消',
        cause,
      }) as Result<T>;
    }

    return fail<ResultError>({
      code: ResultCode.INTERNAL_ERROR,
      message: '网络连接异常',
      cause,
    }) as Result<T>;
  }
}
