/**
 * Session Management Application Service
 * 会话管理应用服务 - 负责会话和设备管理相关的用例
 */

import type {
  GetActiveSessionsRequest,
  ActiveSessionsResponse,
  RevokeSessionRequest,
  RevokeAllSessionsRequest,
  TrustedDevicesResponse,
  TrustDeviceRequest,
  RevokeTrustedDeviceRequest,
} from '@dailyuse/contracts/authentication';
import { useAuthStore } from '../../presentation/stores/authStore';
import { authApiClient } from '../../infrastructure/api/authApiClient';

// Type aliases
type GetActiveSessionsRequestDTO = GetActiveSessionsRequest;
type ActiveSessionsResponseDTO = ActiveSessionsResponse;
type RevokeSessionRequestDTO = RevokeSessionRequest;
type RevokeAllSessionsRequestDTO = RevokeAllSessionsRequest;
type TrustedDevicesResponseDTO = TrustedDevicesResponse;
type TrustDeviceRequestDTO = TrustDeviceRequest;
type RevokeTrustedDeviceRequestDTO = RevokeTrustedDeviceRequest;

export class SessionApplicationService {
  private static instance: SessionApplicationService;

  private constructor() {}

  static createInstance(): SessionApplicationService {
    SessionApplicationService.instance = new SessionApplicationService();
    return SessionApplicationService.instance;
  }

  static getInstance(): SessionApplicationService {
    if (!SessionApplicationService.instance) {
      SessionApplicationService.instance = SessionApplicationService.createInstance();
    }
    return SessionApplicationService.instance;
  }

  private get authStore(): ReturnType<typeof useAuthStore> {
    return useAuthStore();
  }

  // ============ 会话管理 ============

  async getActiveSessions(
    request?: GetActiveSessionsRequestDTO,
  ): Promise<ActiveSessionsResponseDTO> {
    try {
      this.authStore.setLoading(true);
      const response = await authApiClient.getActiveSessions(request);
      this.authStore.setActiveSessions(response.sessions);
      return response;
    } catch (error) {
      console.error('Failed to get active sessions:', error);
      throw error;
    } finally {
      this.authStore.setLoading(false);
    }
  }

  async revokeSession(request: RevokeSessionRequestDTO): Promise<void> {
    try {
      this.authStore.setLoading(true);
      await authApiClient.revokeSession(request);
      this.authStore.removeSession(request.sessionId);
    } catch (error) {
      console.error('Failed to revoke session:', error);
      throw error;
    } finally {
      this.authStore.setLoading(false);
    }
  }

  async revokeAllSessions(
    request?: RevokeAllSessionsRequestDTO,
  ): Promise<void> {
    try {
      this.authStore.setLoading(true);
      await authApiClient.revokeAllSessions(request);
      if (request?.includeCurrent) {
        this.authStore.clearAuth();
      } else {
        this.authStore.clearSessions();
      }
    } catch (error) {
      console.error('Failed to revoke all sessions:', error);
      throw error;
    } finally {
      this.authStore.setLoading(false);
    }
  }

  // ============ 设备管理 ============

  async getTrustedDevices(): Promise<TrustedDevicesResponseDTO> {
    try {
      this.authStore.setLoading(true);
      const response = await authApiClient.getTrustedDevices();
      this.authStore.setTrustedDevices(response.devices);
      return response;
    } catch (error) {
      console.error('Failed to get trusted devices:', error);
      throw error;
    } finally {
      this.authStore.setLoading(false);
    }
  }

  async trustDevice(request: TrustDeviceRequestDTO): Promise<void> {
    try {
      this.authStore.setLoading(true);
      await authApiClient.trustDevice(request);
      // 重新加载受信任设备列表
      await this.getTrustedDevices();
    } catch (error) {
      console.error('Failed to trust device:', error);
      throw error;
    } finally {
      this.authStore.setLoading(false);
    }
  }

  async revokeTrustedDevice(
    request: RevokeTrustedDeviceRequestDTO,
  ): Promise<void> {
    try {
      this.authStore.setLoading(true);
      await authApiClient.revokeTrustedDevice(request);
      this.authStore.removeTrustedDevice(request.deviceId);
    } catch (error) {
      console.error('Failed to revoke trusted device:', error);
      throw error;
    } finally {
      this.authStore.setLoading(false);
    }
  }
}

export const sessionApplicationService = SessionApplicationService.getInstance();

