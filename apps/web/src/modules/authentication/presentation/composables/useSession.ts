/**
 * Session Composable
 * 会话组合式 API
 *
 * 职责:
 * - 调用 SessionApplicationService 获取数据
 * - 管理会话和信任设备的状态
 * - 处理设备安全相关操作
 */

import { computed } from 'vue';
import { useAuthenticationStore } from '../stores/authenticationStore';
import type {
  GetActiveSessionsRequestDTO,
  RevokeSessionRequestDTO,
  RevokeAllSessionsRequestDTO,
  TrustDeviceRequestDTO,
  RevokeTrustedDeviceRequestDTO,
  ActiveSessionsResponseDTO,
  TrustedDevicesResponseDTO,
} from '@dailyuse/contracts/account';
import {
  GetActiveSessions,
  RevokeSession,
  RevokeAllSessions,
  GetTrustedDevices,
  TrustDevice,
  RevokeTrustedDevice,
} from '@dailyuse/application-client/authentication';

export function useSession() {
  const authStore = useAuthenticationStore();
  const getActiveSessionsUseCase = GetActiveSessions.getInstance();
  const revokeSessionUseCase = RevokeSession.getInstance();
  const revokeAllSessionsUseCase = RevokeAllSessions.getInstance();
  const getTrustedDevicesUseCase = GetTrustedDevices.getInstance();
  const trustDeviceUseCase = TrustDevice.getInstance();
  const revokeTrustedDeviceUseCase = RevokeTrustedDevice.getInstance();

  // ============ State (from store) ============
  const activeSessions = computed(() => authStore.activeSessions);
  const trustedDevices = computed(() => authStore.trustedDevices);
  const isLoading = computed(() => authStore.isLoading);
  const error = computed(() => authStore.error);

  // ============ Session Methods ============

  /**
   * 获取活动会话
   */
  async function loadActiveSessions(
    request?: GetActiveSessionsRequestDTO,
  ): Promise<ActiveSessionsResponseDTO | null> {
    authStore.setLoading(true);
    try {
      const response = await getActiveSessionsUseCase.execute(request);
      authStore.setActiveSessions(response.sessions || []);
      authStore.setError(null);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取活动会话失败';
      authStore.setError(errorMessage);
      console.error('❌ [useSession] 获取活动会话失败:', err);
      return null;
    } finally {
      authStore.setLoading(false);
    }
  }

  /**
   * 撤销会话
   */
  async function revokeSession(request: RevokeSessionRequestDTO): Promise<boolean> {
    authStore.setLoading(true);
    try {
      await revokeSessionUseCase.execute(request);
      authStore.removeActiveSession(request.sessionId);
      authStore.setError(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '撤销会话失败';
      authStore.setError(errorMessage);
      console.error('❌ [useSession] 撤销会话失败:', err);
      return false;
    } finally {
      authStore.setLoading(false);
    }
  }

  /**
   * 撤销所有会话
   */
  async function revokeAllSessions(request?: RevokeAllSessionsRequestDTO): Promise<boolean> {
    authStore.setLoading(true);
    try {
      await revokeAllSessionsUseCase.execute(request);
      authStore.clearActiveSessions();
      authStore.setError(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '撤销所有会话失败';
      authStore.setError(errorMessage);
      console.error('❌ [useSession] 撤销所有会话失败:', err);
      return false;
    } finally {
      authStore.setLoading(false);
    }
  }

  /**
   * 获取信任的设备
   */
  async function loadTrustedDevices(): Promise<TrustedDevicesResponseDTO | null> {
    authStore.setLoading(true);
    try {
      const response = await getTrustedDevicesUseCase.execute();
      authStore.setTrustedDevices(response);
      authStore.setError(null);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取信任的设备失败';
      authStore.setError(errorMessage);
      console.error('❌ [useSession] 获取信任的设备失败:', err);
      return null;
    } finally {
      authStore.setLoading(false);
    }
  }

  /**
   * 信任设备
   */
  async function trustDevice(request: TrustDeviceRequestDTO): Promise<boolean> {
    authStore.setLoading(true);
    try {
      await trustDeviceUseCase.execute(request);
      // 重新加载设备列表
      await loadTrustedDevices();
      authStore.setError(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '信任设备失败';
      authStore.setError(errorMessage);
      console.error('❌ [useSession] 信任设备失败:', err);
      return false;
    } finally {
      authStore.setLoading(false);
    }
  }

  /**
   * 撤销信任的设备
   */
  async function revokeTrustedDevice(request: RevokeTrustedDeviceRequestDTO): Promise<boolean> {
    authStore.setLoading(true);
    try {
      await revokeTrustedDeviceUseCase.execute(request);
      authStore.removeTrustedDevice(request.deviceId);
      authStore.setError(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '撤销信任的设备失败';
      authStore.setError(errorMessage);
      console.error('❌ [useSession] 撤销信任的设备失败:', err);
      return false;
    } finally {
      authStore.setLoading(false);
    }
  }

  return {
    // State
    activeSessions,
    trustedDevices,
    isLoading,
    error,

    // Actions
    loadActiveSessions,
    revokeSession,
    revokeAllSessions,
    loadTrustedDevices,
    trustDevice,
    revokeTrustedDevice,
  };
}
