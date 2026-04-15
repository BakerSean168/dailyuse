/**
 * HTTP Client Types
 *
 * 通用 HTTP 客户端接口与配置类型定义。
 * 不依赖任何具体实现（Axios / Fetch / IPC），
 * 是所有 HTTP 适配器的抽象契约。
 *
 * @module @dailyuse/http-client
 */

import type { AxiosRequestConfig } from 'axios';

// ============================================================================
// Abstract HTTP Client Interface
// ============================================================================

/**
 * HTTP Client 配置
 */
export interface HttpClientConfig {
  baseUrl: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * HTTP 请求选项
 */
export interface HttpRequestOptions {
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
}

/**
 * 抽象 HTTP Client 接口
 *
 * 所有 HTTP 适配器（GoalHttpAdapter 等）依赖此接口。
 * 具体实现：
 * - AxiosHttpClient: 使用 Axios（Web 环境）
 * - FetchHttpClient: 使用原生 Fetch
 * - IpcHttpClient: 使用 Electron IPC（Desktop 环境）
 */
export interface HttpClient {
  get<T>(url: string, options?: HttpRequestOptions): Promise<T>;
  post<T>(url: string, data?: unknown, options?: HttpRequestOptions): Promise<T>;
  put<T>(url: string, data?: unknown, options?: HttpRequestOptions): Promise<T>;
  patch<T>(url: string, data?: unknown, options?: HttpRequestOptions): Promise<T>;
  delete<T>(url: string, options?: HttpRequestOptions): Promise<T>;
}

/**
 * HttpClient 类型别名（更明确的命名）
 */
export type IHttpClient = HttpClient;

// ============================================================================
// Result HTTP Client Interface
// ============================================================================

/**
 * Result HTTP Client 接口
 *
 * 所有方法返回 `Promise<Result<T>>`，永不抛出异常。
 * 适配器可以依赖此接口而不依赖具体实现。
 */
export interface IResultHttpClient {
  get<T = unknown>(url: string, config?: { params?: Record<string, unknown> }): Promise<import('@dailyuse/contracts/result').Result<T>>;
  post<T = unknown>(url: string, data?: unknown, config?: { params?: Record<string, unknown> }): Promise<import('@dailyuse/contracts/result').Result<T>>;
  put<T = unknown>(url: string, data?: unknown, config?: { params?: Record<string, unknown> }): Promise<import('@dailyuse/contracts/result').Result<T>>;
  patch<T = unknown>(url: string, data?: unknown, config?: { params?: Record<string, unknown> }): Promise<import('@dailyuse/contracts/result').Result<T>>;
  delete<T = unknown>(url: string, config?: { params?: Record<string, unknown> }): Promise<import('@dailyuse/contracts/result').Result<T>>;
  stream(
    url: string,
    config?: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      body?: unknown;
      headers?: Record<string, string>;
      signal?: AbortSignal;
    },
  ): Promise<Response>;
}

// ============================================================================
// Axios HTTP Client Configuration
// ============================================================================

/**
 * Token 提供者接口
 *
 * 用于解耦 Token 获取策略。
 * 可以从 AuthContainer.tokenStorage、Pinia Store 或 localStorage 获取。
 */
export interface TokenProvider {
  /** 获取当前的 Access Token */
  getAccessToken(): string | null;
  /** 获取 Refresh Token（用于自动刷新） */
  getRefreshToken?(): string | null;
}

/**
 * Token 刷新回调
 *
 * 当 401 发生时用于自动重试机制
 */
export type TokenRefreshHandler = () => Promise<string | null>;

/**
 * Axios HTTP Client 配置
 */
export interface AxiosHttpClientConfig {
  /** API 基础 URL（默认: '/api/v1'） */
  baseURL?: string;
  /** 请求超时时间（毫秒，默认: 10000） */
  timeout?: number;
  /** Token 提供者 */
  tokenProvider?: TokenProvider;
  /** Token 刷新处理器（用于 401 自动重试） */
  onTokenRefresh?: TokenRefreshHandler;
  /** 401 未授权回调（例如跳转登录页） */
  onUnauthorized?: () => void;
  /** 额外的 Axios 配置 */
  axiosConfig?: AxiosRequestConfig;
  /** 是否开启请求/响应日志（开发环境默认开启） */
  enableLogging?: boolean;
}

/**
 * 默认配置
 */
export const DEFAULT_HTTP_CLIENT_CONFIG: Required<
  Pick<AxiosHttpClientConfig, 'baseURL' | 'timeout' | 'enableLogging'>
> = {
  baseURL: '/api/v1',
  timeout: 10000,
  enableLogging: false,
};
