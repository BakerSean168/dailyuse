/**
 * Authentication Store - Pinia 状态管理
 *
 * 管理 Authentication 模块的所有状态
 * - Vue 3 + Pinia
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
  AuthBootstrapSnapshot,
} from '@dailyuse/contracts/authentication';

// ============ State Interface ============
export interface AuthenticationState {
  // 当前认证身份
  currentIdentity: AuthIdentityClientDTO | null;

  // 认证模式
  authMode: string | null;

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
  error: string | null;

  // 是否正在初始化
  isInitializing: boolean;

  // Desktop 启动快照（仅桌面端使用，不持久化）
  desktopBootstrapSnapshot: AuthBootstrapSnapshot | null;
}

// ============ Store ============
export const useAuthenticationStore = defineStore('authentication', {
  state: (): AuthenticationState => ({
    currentIdentity: null,
    authMode: null,
    accessToken: null,
    refreshToken: null,
    activeSessions: [],
    currentSession: null,
    isLoading: false,
    error: null,
    isInitializing: false,
    desktopBootstrapSnapshot: null,
  }),

  getters: {
    // ========== 认证状态 ==========
    /**
     * Desktop prefers the runtime bootstrap snapshot.
     * Web falls back to persisted identity + token.
     */
    isAuthenticated: (state) =>
      state.desktopBootstrapSnapshot
        ? state.desktopBootstrapSnapshot.status.authenticated
        : state.currentIdentity !== null && state.accessToken !== null,

    getIdentityId: (state) => state.currentIdentity?.id ?? null,

    getIdentityStatus: (state) => state.currentIdentity?.status ?? null,

    // ========== 会话状态 ==========
    getActiveSessionCount: (state) => state.activeSessions?.length ?? 0,
  },

  actions: {
    // ========== Identity Actions ==========
    setCurrentIdentity(identity: AuthIdentityClientDTO | null) {
      this.currentIdentity = identity;
    },

    clearCurrentIdentity() {
      this.currentIdentity = null;
    },

    setAuthMode(mode: string | null) {
      this.authMode = mode;
    },

    // ========== Token Actions ==========
    setAccessToken(token: string | null, expiresAt?: number) {
      this.accessToken = token;
    },

    setRefreshToken(token: string | null) {
      this.refreshToken = token;
    },

    clearTokens() {
      this.accessToken = null;
      this.refreshToken = null;
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

    hydrateDesktopBootstrapSnapshot(snapshot: AuthBootstrapSnapshot) {
      this.desktopBootstrapSnapshot = snapshot;
      this.authMode = snapshot.status.mode;
      this.currentIdentity = snapshot.currentUser?.identity ?? null;
      this.currentSession = snapshot.currentUser?.session ?? null;
      this.activeSessions = snapshot.currentUser?.session ? [snapshot.currentUser.session] : [];
      this.accessToken = null;
      this.refreshToken = null;
      this.error = null;
      this.isLoading = false;
      this.isInitializing = false;
    },

    // ========== Auth Response Handler ==========
    /**
     * 处理认证响应（登录/注册成功后统一调用）
     */
    handleAuthResponse(data: AuthResponseDTO) {
      this.setAccessToken(data.accessToken, data.session?.expiresAt);
      if (data.refreshToken) {
        this.setRefreshToken(data.refreshToken);
      }
      this.setCurrentIdentity(data.identity);
      this.setCurrentSession(data.session);
      if ((data as any).authMode) {
        this.setAuthMode((data as any).authMode);
      }
    },

    // ========== Lifecycle ==========
    reset() {
      this.currentIdentity = null;
      this.authMode = null;
      this.accessToken = null;
      this.refreshToken = null;
      this.activeSessions = [];
      this.currentSession = null;
      this.isLoading = false;
      this.error = null;
      this.isInitializing = false;
      this.desktopBootstrapSnapshot = null;
    },
  },

  persist: {
    // 持久化令牌和身份（desktop bootstrap snapshot is runtime-only）
    pick: ['accessToken', 'refreshToken', 'currentIdentity', 'authMode'] as string[],
  },
});
