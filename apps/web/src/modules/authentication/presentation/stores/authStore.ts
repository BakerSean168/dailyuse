import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  LoginRequest,
  RegisterRequest,
  AuthTokens,
  ActiveSessionsResponse,
  ApiKeyListResponse,
  TrustedDevicesResponse,
} from '@dailyuse/contracts/authentication';

// 使用 DTO 类型
type SessionDTO = ActiveSessionsResponse['sessions'][0];
type ApiKeyDTO = ApiKeyListResponse['keys'][0];
type TrustedDeviceDTO = TrustedDevicesResponse['devices'][0];

/**
 * Auth Store - 状态管理
 * 职责：纯数据存储和缓存管理，不执行业务逻辑
 */
export const useAuthStore = defineStore('auth', () => {
  // ===== 状态 =====

  // Token 相关
  const accessToken = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);
  const tokenExpiresAt = ref<number | null>(null);

  // 会话相关
  const currentSessionId = ref<string | null>(null);
  const activeSessions = ref<SessionDTO[]>([]);

  // API Keys
  const apiKeys = ref<ApiKeyDTO[]>([]);

  // 受信任设备
  const trustedDevices = ref<TrustedDeviceDTO[]>([]);

  // 两步验证状态
  const twoFactorSecret = ref<string | null>(null);
  const twoFactorQrCode = ref<string | null>(null);
  const twoFactorBackupCodes = ref<string[]>([]);

  // UI 状态
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // 记住的登录信息
  const rememberedIdentifier = ref<string | null>(null);

  // ===== 计算属性 =====

  /**
   * 是否已认证
   */
  const isAuthenticated = computed(() => !!accessToken.value);

  /**
   * Token 是否过期
   */
  const isTokenExpired = computed(() => {
    if (!tokenExpiresAt.value) return true;
    return Date.now() >= tokenExpiresAt.value;
  });

  /**
   * Token 即将过期（10分钟内）
   */
  const isTokenExpiringSoon = computed(() => {
    if (!tokenExpiresAt.value) return false;
    const tenMinutes = 10 * 60 * 1000;
    return tokenExpiresAt.value - Date.now() < tenMinutes;
  });

  /**
   * 当前会话数量
   */
  const sessionCount = computed(() => activeSessions.value.length);

  /**
   * API Key 数量
   */
  const apiKeyCount = computed(() => apiKeys.value.length);

  /**
   * 受信任设备数量
   */
  const trustedDeviceCount = computed(() => trustedDevices.value.length);

  // ===== Token 管理 =====

  /**
   * 设置访问令牌
   */
  function setAccessToken(token: string) {
    accessToken.value = token;
    localStorage.setItem('accessToken', token);
  }

  /**
   * 设置刷新令牌
   */
  function setRefreshToken(token: string) {
    refreshToken.value = token;
    localStorage.setItem('refreshToken', token);
  }

  /**
   * 设置令牌过期时间
   */
  function setTokenExpiresAt(expiresAt: number) {
    tokenExpiresAt.value = expiresAt;
    localStorage.setItem('tokenExpiresAt', expiresAt.toString());
  }

  /**
   * 清除 tokens
   */
  function clearTokens() {
    accessToken.value = null;
    refreshToken.value = null;
    tokenExpiresAt.value = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiresAt');
  }

  // ===== 会话管理 =====

  /**
   * 设置当前会话 ID
   */
  function setCurrentSessionId(sessionId: string) {
    currentSessionId.value = sessionId;
    localStorage.setItem('currentSessionId', sessionId);
  }

  /**
   * 设置活跃会话列表
   */
  function setActiveSessions(sessions: SessionDTO[]) {
    activeSessions.value = sessions;
  }

  /**
   * 移除会话
   */
  function removeSession(sessionId: string) {
    activeSessions.value = activeSessions.value.filter((s: SessionDTO) => s.id !== sessionId);
  }

  /**
   * 清除所有会话
   */
  function clearSessions() {
    currentSessionId.value = null;
    activeSessions.value = [];
    localStorage.removeItem('currentSessionId');
  }

  // ===== API Key 管理 =====

  /**
   * 设置 API Keys
   */
  function setApiKeys(keys: ApiKeyDTO[]) {
    apiKeys.value = keys;
  }

  /**
   * 添加 API Key
   */
  function addApiKey(key: ApiKeyDTO) {
    apiKeys.value.push(key);
  }

  /**
   * 移除 API Key
   */
  function removeApiKey(keyId: string) {
    apiKeys.value = apiKeys.value.filter((k: ApiKeyDTO) => k.id !== keyId);
  }

  // ===== 设备管理 =====

  /**
   * 设置受信任设备列表
   */
  function setTrustedDevices(devices: TrustedDeviceDTO[]) {
    trustedDevices.value = devices;
  }

  /**
   * 添加受信任设备
   */
  function addTrustedDevice(device: TrustedDeviceDTO) {
    trustedDevices.value.push(device);
  }

  /**
   * 移除受信任设备
   */
  function removeTrustedDevice(deviceId: string) {
    trustedDevices.value = trustedDevices.value.filter((d: TrustedDeviceDTO) => d.deviceId !== deviceId);
  }

  // ===== 两步验证管理 =====

  /**
   * 设置两步验证信息
   */
  function setTwoFactorSetup(secret: string, qrCodeUrl: string, backupCodes: string[]) {
    twoFactorSecret.value = secret;
    twoFactorQrCode.value = qrCodeUrl;
    twoFactorBackupCodes.value = backupCodes;
  }

  /**
   * 清除两步验证信息
   */
  function clearTwoFactorSetup() {
    twoFactorSecret.value = null;
    twoFactorQrCode.value = null;
    twoFactorBackupCodes.value = [];
  }

  // ===== UI 状态管理 =====

  /**
   * 设置加载状态
   */
  function setLoading(loading: boolean) {
    isLoading.value = loading;
  }

  /**
   * 设置错误
   */
  function setError(err: string | null) {
    error.value = err;
  }

  /**
   * 清除错误
   */
  function clearError() {
    error.value = null;
  }

  // ===== 记住登录信息 =====

  /**
   * 记住登录标识符
   */
  function rememberIdentifier(identifier: string) {
    rememberedIdentifier.value = identifier;
    localStorage.setItem('rememberedIdentifier', identifier);
  }

  /**
   * 忘记登录标识符
   */
  function forgetIdentifier() {
    rememberedIdentifier.value = null;
    localStorage.removeItem('rememberedIdentifier');
  }

  // ===== 清除所有认证数据 =====

  /**
   * 清除所有认证状态
   */
  function clearAuth() {
    clearTokens();
    clearSessions();
    apiKeys.value = [];
    trustedDevices.value = [];
    clearTwoFactorSetup();
    error.value = null;
  }

  /**
   * 完全清除（包括记住的信息）
   */
  function clearAll() {
    clearAuth();
    forgetIdentifier();
    isLoading.value = false;
  }

  // ===== 从存储恢复 =====

  /**
   * 从 localStorage 恢复认证信息
   */
  function restoreFromStorage() {
    try {
      const savedAccessToken = localStorage.getItem('accessToken');
      const savedRefreshToken = localStorage.getItem('refreshToken');
      const savedTokenExpiresAt = localStorage.getItem('tokenExpiresAt');
      const savedSessionId = localStorage.getItem('currentSessionId');
      const savedIdentifier = localStorage.getItem('rememberedIdentifier');

      if (savedAccessToken) {
        accessToken.value = savedAccessToken;
      }
      if (savedRefreshToken) {
        refreshToken.value = savedRefreshToken;
      }
      if (savedTokenExpiresAt) {
        tokenExpiresAt.value = parseInt(savedTokenExpiresAt, 10);
      }
      if (savedSessionId) {
        currentSessionId.value = savedSessionId;
      }
      if (savedIdentifier) {
        rememberedIdentifier.value = savedIdentifier;
      }
    } catch (error) {
      console.error('Failed to restore auth from storage:', error);
      setError('Failed to restore authentication data');
    }
  }

  // ===== 初始化 =====
  // 自动从 localStorage 恢复
  restoreFromStorage();

  // ===== 返回 =====
  return {
    // Token 状态
    accessToken,
    refreshToken,
    tokenExpiresAt,

    // 会话状态
    currentSessionId,
    activeSessions,

    // API Keys
    apiKeys,

    // 受信任设备
    trustedDevices,

    // 两步验证
    twoFactorSecret,
    twoFactorQrCode,
    twoFactorBackupCodes,

    // UI 状态
    isLoading,
    error,

    // 记住的信息
    rememberedIdentifier,

    // 计算属性
    isAuthenticated,
    isTokenExpired,
    isTokenExpiringSoon,
    sessionCount,
    apiKeyCount,
    trustedDeviceCount,

    // Token 管理
    setAccessToken,
    setRefreshToken,
    setTokenExpiresAt,
    clearTokens,

    // 会话管理
    setCurrentSessionId,
    setActiveSessions,
    removeSession,
    clearSessions,

    // API Key 管理
    setApiKeys,
    addApiKey,
    removeApiKey,

    // 设备管理
    setTrustedDevices,
    addTrustedDevice,
    removeTrustedDevice,

    // 两步验证管理
    setTwoFactorSetup,
    clearTwoFactorSetup,

    // UI 状态管理
    setLoading,
    setError,
    clearError,

    // 记住登录信息
    rememberIdentifier,
    forgetIdentifier,

    // 清除数据
    clearAuth,
    clearAll,
    restoreFromStorage,
  };
});

