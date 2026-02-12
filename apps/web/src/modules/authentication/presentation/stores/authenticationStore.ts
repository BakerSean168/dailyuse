/**
 * Authentication Store - Pinia 状态管理
 *
 * 管理 Authentication 模块的所有状态
 * - Vue 3 + Pinia（Web 应用专用）
 * - Store 在 Composables 中被调用
 * - Composables 处理 Store 更新和 UI 状态
 *
 * @module authentication/presentation/stores
 */

import { defineStore } from 'pinia';
import type {
  AuthIdentityClientDTO,
  AuthSessionClientDTO,
  AuthResponseDTO,
} from '@dailyuse/contracts/authentication';

// ============ State Interface ============
export interface AuthenticationState {
  // 当前认证身份
  currentIdentity: AuthIdentityClientDTO | null;

  // 访问令牌
  accessToken: string | null;

  // 刷新令牌
  refreshToken: string | null;

  // 活动会话列表
  activeSessions: AuthSessionClientDTO[];

  // 当前会话
  currentSession: AuthSessionClientDTO | null;

  // UI 状态
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // 令牌过期时间
  tokenExpiresAt: number | null;

  // 是否正在初始化
  isInitializing: boolean;
}

// ============ Store ============
export const useAuthenticationStore = defineStore('authentication', {
  state: (): AuthenticationState => ({
    currentIdentity: null,
    accessToken: null,
    refreshToken: null,
    activeSessions: [],
    currentSession: null,
    isLoading: false,
    isAuthenticated: false,
    error: null,
    tokenExpiresAt: null,
    isInitializing: false,
  }),

  getters: {
    // ========== 认证状态 ==========
    getIdentityId: (state) => state.currentIdentity?.id ?? null,

    getIdentityStatus: (state) => state.currentIdentity?.status ?? null,

    isTokenExpired: (state) => {
      if (!state.tokenExpiresAt) return true;
      return Date.now() >= state.tokenExpiresAt;
    },

    getTokenExpiresIn: (state) => {
      if (!state.tokenExpiresAt) return 0;
      const remaining = state.tokenExpiresAt - Date.now();
      return Math.max(0, remaining);
    },

    // ========== 会话状态 ==========
    getActiveSessionCount: (state) => state.activeSessions?.length ?? 0,
  },

  actions: {
    // ========== Identity Actions ==========
    setCurrentIdentity(identity: AuthIdentityClientDTO | null) {
      this.currentIdentity = identity;
      this.isAuthenticated = identity !== null;
    },

    clearCurrentIdentity() {
      this.currentIdentity = null;
      this.isAuthenticated = false;
    },

    // ========== Token Actions ==========
    setAccessToken(token: string | null, expiresIn?: number) {
      this.accessToken = token;
      if (expiresIn && token) {
        this.tokenExpiresAt = Date.now() + expiresIn * 1000;
      }
    },

    setRefreshToken(token: string | null) {
      this.refreshToken = token;
    },

    clearTokens() {
      this.accessToken = null;
      this.refreshToken = null;
      this.tokenExpiresAt = null;
    },

    // ========== Session Actions ==========
    setCurrentSession(session: AuthSessionClientDTO | null) {
      this.currentSession = session;
    },

    setActiveSessions(sessions: AuthSessionClientDTO[]) {
      this.activeSessions = sessions;
    },

    clearActiveSessions() {
      this.activeSessions = [];
      this.currentSession = null;
    },

    removeActiveSession(sessionId: string) {
      this.activeSessions = this.activeSessions.filter((s) => s.id !== sessionId);
    },

    // ========== Status Actions ==========
    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    setError(error: string | null) {
      this.error = error;
    },

    setIsInitializing(value: boolean) {
      this.isInitializing = value;
    },

    // ========== Auth Response Handler ==========
    /**
     * 处理认证响应（登录/注册成功后统一调用）
     */
    handleAuthResponse(data: AuthResponseDTO) {
      this.setAccessToken(data.accessToken);
      if (data.refreshToken) {
        this.setRefreshToken(data.refreshToken);
      }
      this.setCurrentIdentity(data.identity);
      this.setCurrentSession(data.session);
    },

    // ========== Lifecycle ==========
    reset() {
      this.currentIdentity = null;
      this.accessToken = null;
      this.refreshToken = null;
      this.activeSessions = [];
      this.currentSession = null;
      this.isLoading = false;
      this.isAuthenticated = false;
      this.error = null;
      this.tokenExpiresAt = null;
      this.isInitializing = false;
    },
  },

  persist: {
    // 持久化令牌和身份
    pick: ['accessToken', 'refreshToken', 'currentIdentity'] as string[],
  },
});
