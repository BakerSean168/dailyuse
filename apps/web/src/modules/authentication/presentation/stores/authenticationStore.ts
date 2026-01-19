/**
 * Authentication Store - Pinia 状态管理
 *
 * 管理 Authentication 模块的所有状态
 * - Vue 3 + Pinia（Web 应用专用）
 * - 对应 desktop 应用的 Zustand store
 *
 * EPIC-018 重构:
 * - 框架无关的 Service 只返回数据
 * - Store 在 Composables 中被调用
 * - Composables 处理 Store 更新和 UI 状态
 *
 * @module authentication/presentation/stores
 */

import { defineStore } from 'pinia';
import type {
  AccountClientDTO,
  AuthSessionClientDTO,
  TrustedDevicesResponseDTO,
  DeviceInfoClientDTO,
} from '@dailyuse/contracts/account';

// ============ State Interface ============
export interface AuthenticationState {
  // 当前认证用户
  currentUser: AccountClientDTO | null;

  // 访问令牌
  accessToken: string | null;

  // 刷新令牌
  refreshToken: string | null;

  // 活动会话列表
  activeSessions: AuthSessionClientDTO[];

  // 信任的设备
  trustedDevices: TrustedDevicesResponseDTO | null;

  // MFA 设备列表
  mfaDevices: DeviceInfoClientDTO[];

  // UI 状态
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // 令牌过期时间
  tokenExpiresAt: number | null;

  // 是否需要 MFA 验证
  requiresMFA: boolean;

  // 是否正在初始化
  isInitializing: boolean;
}

// ============ Store ============
export const useAuthenticationStore = defineStore('authentication', {
  state: (): AuthenticationState => ({
    currentUser: null,
    accessToken: null,
    refreshToken: null,
    activeSessions: [],
    trustedDevices: null,
    mfaDevices: [],
    isLoading: false,
    isAuthenticated: false,
    error: null,
    tokenExpiresAt: null,
    requiresMFA: false,
    isInitializing: false,
  }),

  getters: {
    // ========== 认证状态 ==========
    getCurrentUserId: (state) => state.currentUser?.uuid ?? null,

    getCurrentUserEmail: (state) => state.currentUser?.email ?? null,

    getCurrentUserRole: (state) => state.currentUser?.role ?? null,

    isTokenExpired: (state) => {
      if (!state.tokenExpiresAt) return true;
      return Date.now() >= state.tokenExpiresAt;
    },

    getTokenExpiresIn: (state) => {
      if (!state.tokenExpiresAt) return 0;
      const remaining = state.tokenExpiresAt - Date.now();
      return Math.max(0, remaining);
    },

    // ========== MFA 状态 ==========
    hasMFAEnabled: (state) => (state.mfaDevices?.length ?? 0) > 0,

    getMFADeviceCount: (state) => state.mfaDevices?.length ?? 0,

    // ========== 会话状态 ==========
    getActiveSessionCount: (state) => state.activeSessions?.length ?? 0,

    // ========== 设备状态 ==========
    getTrustedDeviceCount: (state) => state.trustedDevices?.devices?.length ?? 0,
  },

  actions: {
    // ========== User Actions ==========
    setCurrentUser(user: AccountClientDTO | null) {
      this.currentUser = user;
      this.isAuthenticated = user !== null;
    },

    clearCurrentUser() {
      this.currentUser = null;
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
    setActiveSessions(sessions: AuthSessionClientDTO[]) {
      this.activeSessions = sessions;
    },

    clearActiveSessions() {
      this.activeSessions = [];
    },

    removeActiveSession(sessionId: string) {
      this.activeSessions = this.activeSessions.filter((s) => s.id !== sessionId);
    },

    // ========== Trusted Devices Actions ==========
    setTrustedDevices(devices: TrustedDevicesResponseDTO | null) {
      this.trustedDevices = devices;
    },

    clearTrustedDevices() {
      this.trustedDevices = null;
    },

    removeTrustedDevice(deviceId: string) {
      if (this.trustedDevices?.devices) {
        this.trustedDevices.devices = this.trustedDevices.devices.filter(
          (d: any) => d.id !== deviceId,
        );
      }
    },

    // ========== MFA Actions ==========
    setMFADevices(devices: DeviceInfoClientDTO[]) {
      this.mfaDevices = devices;
    },

    clearMFADevices() {
      this.mfaDevices = [];
    },

    removeMFADevice(deviceId: string) {
      this.mfaDevices = this.mfaDevices.filter((d) => d.id !== deviceId);
    },

    // ========== Status Actions ==========
    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    setError(error: string | null) {
      this.error = error;
    },

    setRequiresMFA(value: boolean) {
      this.requiresMFA = value;
    },

    setIsInitializing(value: boolean) {
      this.isInitializing = value;
    },

    // ========== Lifecycle ==========
    reset() {
      this.currentUser = null;
      this.accessToken = null;
      this.refreshToken = null;
      this.activeSessions = [];
      this.trustedDevices = null;
      this.mfaDevices = [];
      this.isLoading = false;
      this.isAuthenticated = false;
      this.error = null;
      this.tokenExpiresAt = null;
      this.requiresMFA = false;
      this.isInitializing = false;
    },
  },

  persist: {
    // 持久化用户偏好和令牌
    paths: ['accessToken', 'refreshToken', 'currentUser'],
  },
});
