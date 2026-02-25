/**
 * Web App — HTTP Client Instance
 *
 * 创建统一的 AxiosHttpClient，配置：
 * - baseURL: /api/v1
 * - TokenProvider: 从 Pinia authenticationStore 读取 accessToken
 * - 401 自动 Token 刷新 + 重试
 * - 刷新失败后跳转登录页
 *
 * @module shared/http
 */

import { AxiosHttpClient, ResultHttpClient, type TokenProvider } from '@dailyuse/http-client';
import { useAuthenticationStore } from '@dailyuse/app-vue';

// ────────────────────────────────────────
// Token Provider（延迟获取 Store 避免循环引用）
// ────────────────────────────────────────

/**
 * TokenProvider 实现
 *
 * useAuthenticationStore() 在 Pinia 安装后才可调用；
 * getAccessToken / getRefreshToken 仅在请求时才被调用，
 * 此时 Pinia 已经就绪。
 */
export const tokenProvider: TokenProvider = {
  getAccessToken() {
    try {
      const store = useAuthenticationStore();
      return store.accessToken;
    } catch {
      return null;
    }
  },
  getRefreshToken() {
    try {
      const store = useAuthenticationStore();
      return store.refreshToken;
    } catch {
      return null;
    }
  },
};

// ────────────────────────────────────────
// HTTP Client 实例
// ────────────────────────────────────────

// ────────────────────────────────────────
// HTTP Client Configuration (Shared)
// ────────────────────────────────────────

const httpClientConfig = {
  baseURL: '/api/v1',
  timeout: 15000,
  tokenProvider,
  onTokenRefresh: async () => {
    const store = useAuthenticationStore();
    const refreshToken = store.refreshToken;
    if (!refreshToken) return null;

    try {
      // 直接用 fetch 调 refresh 接口（不经过 httpClient，避免递归）
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) return null;

      const json = await response.json();
      const data = json.data ?? json;

      // 更新 Store 中的新 Token
      store.$patch({
        accessToken: data.accessToken,
        ...(data.refreshToken ? { refreshToken: data.refreshToken } : {}),
      });
      return data.accessToken;
    } catch {
      return null;
    }
  },
  onUnauthorized: () => {
    // 刷新失败 → 清除状态 → 跳转登录
    try {
      const store = useAuthenticationStore();
      store.$reset();
    } catch {
      // ignore — store may not be ready
    }
    // 使用 window.location 保证一定能跳转
    window.location.href = '/auth';
  },
  enableLogging: import.meta.env.DEV,
};

/**
 * 全局 HTTP Client 实例 (Legacy - throws errors)
 *
 * 由 web app 独占，负责：
 * - 注入 Auth Token
 * - 剥离后端 HttpResponse<T> 信封
 * - 错误统一转换为 HttpClientError
 * - 401 Token 刷新 + 重试
 *
 * @deprecated 新代码请使用 resultHttpClient
 */
export const httpClient = new AxiosHttpClient(httpClientConfig);

/**
 * Result HTTP Client 实例 (Recommended)
 *
 * 所有方法返回 Promise<Result<T>>，永不抛出异常。
 * 用于所有新的模块和重构后的模块。
 *
 * @example
 * ```ts
 * const result = await resultHttpClient.get<User[]>('/users');
 * if (result.ok) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error.message);
 * }
 * ```
 */
export const resultHttpClient = new ResultHttpClient(httpClientConfig);
