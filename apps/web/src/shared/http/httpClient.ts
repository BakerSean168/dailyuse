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

import {
  AxiosHttpClient,
  type TokenProvider,
} from '@dailyuse/http-client';

// ────────────────────────────────────────
// Token Provider（延迟获取 Store 避免循环引用）
// ────────────────────────────────────────

/**
 * TokenProvider 实现
 *
 * 延迟导入 authenticationStore 以避免 Pinia 在 createApp 之前初始化的问题。
 */
export const tokenProvider: TokenProvider = {
  getAccessToken() {
    try {
      const { useAuthenticationStore } = require('@/modules/authentication/presentation/stores/authenticationStore');
      const store = useAuthenticationStore();
      return store.accessToken;
    } catch {
      return null;
    }
  },
  getRefreshToken() {
    try {
      const { useAuthenticationStore } = require('@/modules/authentication/presentation/stores/authenticationStore');
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

/**
 * 全局 HTTP Client 实例
 *
 * 由 web app 独占，负责：
 * - 注入 Auth Token
 * - 剥离后端 HttpResponse<T> 信封
 * - 错误统一转换为 HttpClientError
 * - 401 Token 刷新 + 重试
 */
export const httpClient = new AxiosHttpClient({
  baseURL: '/api/v1',
  timeout: 15000,
  tokenProvider,
  onTokenRefresh: async () => {
    // 延迟导入避免循环依赖
    const { useAuthenticationStore } = await import(
      '@/modules/authentication/presentation/stores/authenticationStore'
    );
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
      store.setAccessToken(data.accessToken);
      if (data.refreshToken) {
        store.setRefreshToken(data.refreshToken);
      }
      return data.accessToken;
    } catch {
      return null;
    }
  },
  onUnauthorized: () => {
    // 刷新失败 → 清除状态 → 跳转登录
    import('@/modules/authentication/presentation/stores/authenticationStore').then(
      ({ useAuthenticationStore }) => {
        const store = useAuthenticationStore();
        store.reset();
      },
    );
    // 使用 window.location 保证一定能跳转
    window.location.href = '/auth';
  },
  enableLogging: import.meta.env.DEV,
});
