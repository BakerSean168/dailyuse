/**
 * HTTP Module Types
 *
 * Axios HTTP 客户端的配置类型定义
 *
 * @module @dailyuse/infrastructure-client/http
 */

import type { AxiosRequestConfig } from 'axios';

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
