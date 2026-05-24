import type { ILogger } from '@dailyuse/utils';
import type {
  IAuthSessionRepository,
  IAuthIdentityRepository as IAuthCredentialRepository,
  AuthSession,
} from '@dailyuse/authentication/domain-server';
import {
  type IpcResult,
  toIpcResult,
  ok,
  fail,
} from '@dailyuse/contracts/result';
import {
  AuthMode,
  AuthRuntimeState,
  type AuthSessionClientDTO,
  type AuthSessionId,
  type GetCurrentUserRes,
  type TwoFactorStatus,
  type ApiKeyInfo,
  type DeviceInfoUI,
  type ListSessionsRes,
  type SessionInfo,
} from '@dailyuse/contracts/authentication';
import { SessionManager, TokenManager } from '../infrastructure';
import type { AuthState } from './desktop-credential-auth-coordinator';
import {
  buildFallbackIdentityClientDTO,
  toIdentityLookupId,
} from './auth-coordinator-helpers';

/**
 * Handles security admin operations: 2FA, API keys, session management, device management.
 */
export class DesktopAuthSecurityAdminService {
  constructor(
    private readonly logger: ILogger,
    private readonly sessionManager: SessionManager | null,
    private readonly tokenManager: TokenManager,
    private readonly credentialRepository: IAuthCredentialRepository | null,
    private readonly sessionRepository: IAuthSessionRepository | null,
    private readonly authState: AuthState,
  ) {}

  // ============================================
  // 2FA Methods
  // ============================================

  async enable2FA(method: string): Promise<IpcResult<{ qrCodeUrl?: string; secret?: string }>> {
    this.logger.debug('Enable 2FA', { method });

    if (this.authState.authMode !== AuthMode.ONLINE_USER) {
      return toIpcResult(fail({ code: 'ONLINE_REQUIRED', message: '2FA 需要在线模式' }));
    }

    return toIpcResult(fail({ code: 'NOT_IMPLEMENTED', message: '2FA 功能尚未实现' }));
  }

  async disable2FA(): Promise<IpcResult<void>> {
    this.logger.debug('Disable 2FA');
    return toIpcResult(fail({ code: 'NOT_IMPLEMENTED', message: '2FA 功能尚未实现' }));
  }

  async verify2FA(code: string): Promise<IpcResult<void>> {
    this.logger.debug('Verify 2FA');
    void code;
    return toIpcResult(fail({ code: 'NOT_IMPLEMENTED', message: '2FA 功能尚未实现' }));
  }

  async get2FAStatus(): Promise<TwoFactorStatus> {
    this.logger.debug('Get 2FA status');
    return { enabled: false, method: null };
  }

  async generateBackupCodes(): Promise<{ codes: string[] }> {
    this.logger.debug('Generate backup codes');
    return { codes: [] };
  }

  // ============================================
  // API Keys Methods
  // ============================================

  async createApiKey(request: {
    name: string;
    scopes?: string[];
  }): Promise<{ id: string; key: string } | null> {
    this.logger.debug('Create API key', { name: request.name });

    if (this.authState.authMode !== AuthMode.ONLINE_USER) {
      return null;
    }

    return null;
  }

  async listApiKeys(): Promise<{ apiKeys: ApiKeyInfo[]; total: number }> {
    this.logger.debug('List API keys');
    return { apiKeys: [], total: 0 };
  }

  async revokeApiKey(keyId: string): Promise<IpcResult<void>> {
    this.logger.debug('Revoke API key', { keyId });
    return toIpcResult(fail({ code: 'NOT_IMPLEMENTED', message: 'API Key 功能尚未实现' }));
  }

  async rotateApiKey(keyId: string): Promise<{ newKey: string | null }> {
    this.logger.debug('Rotate API key', { keyId });
    return { newKey: null };
  }

  // ============================================
  // Sessions Methods
  // ============================================

  async listSessions(): Promise<ListSessionsRes> {
    this.logger.debug('List sessions');

    if (!this.sessionRepository) {
      return { sessions: [] };
    }

    try {
      const currentSession = this.sessionManager?.getCurrentSession();
      if (!currentSession) {
        return { sessions: [] };
      }

      const sessions = await this.sessionRepository.findByIdentityId(currentSession.identityId);
      const sessionInfos: AuthSessionClientDTO[] = sessions.map((s: AuthSession) =>
        s.toClientDTO(s.id === currentSession.id),
      );

      return { sessions: sessionInfos };
    } catch (error) {
      this.logger.error('Failed to list sessions', { error });
      return { sessions: [] };
    }
  }

  async getCurrentUser(): Promise<GetCurrentUserRes> {
    const identityId = this.getCurrentIdentityId();
    const session = this.sessionManager?.getCurrentSession() ?? null;
    const identity = identityId
      ? await this.credentialRepository?.findById(toIdentityLookupId(identityId))
      : null;

    return {
      identity: identity
        ? identity.toClientDTO()
        : buildFallbackIdentityClientDTO(identityId ?? 'unknown'),
      session: session ? session.toClientDTO(true) : null,
    };
  }

  async getCurrentSession(): Promise<SessionInfo | null> {
    this.logger.debug('Get current session');

    const session = this.sessionManager?.getCurrentSession();
    if (!session) {
      return null;
    }

    return {
      id: session.id,
      deviceName: session.deviceInfo?.deviceName ?? session.deviceInfo?.deviceId ?? 'Unknown',
      deviceType: session.deviceInfo?.deviceType ?? 'DESKTOP',
      ipAddress: session.deviceInfo?.ipAddress ?? '',
      createdAt: new Date(session.createdAt).toISOString(),
      lastActiveAt: new Date(session.lastActiveAt).toISOString(),
      expiresAt: new Date(session.expiresAt).toISOString(),
      isCurrentSession: true,
    };
  }

  async revokeSession(sessionId?: string): Promise<IpcResult<void>> {
    this.logger.debug('Revoke session', { sessionId });

    if (!sessionId) {
      return toIpcResult(fail({ code: 'VALIDATION_ERROR', message: '缺少 sessionId' }));
    }

    if (!this.sessionRepository) {
      return toIpcResult(fail({ code: 'NOT_INITIALIZED', message: '服务未初始化' }));
    }

    try {
      const session = await this.sessionRepository.findById(sessionId as AuthSessionId);
      if (!session) {
        return toIpcResult(fail({ code: 'NOT_FOUND', message: '会话不存在' }));
      }

      const currentSession = this.sessionManager?.getCurrentSession();
      if (currentSession && session.id === currentSession.id) {
        return toIpcResult(
          fail({ code: 'INVALID_OPERATION', message: '无法撤销当前会话，请使用登出' }),
        );
      }

      session.revoke();
      await this.sessionRepository.save(session);

      this.logger.info('Session revoked', { sessionId });
      return toIpcResult(ok(undefined));
    } catch (error) {
      this.logger.error('Failed to revoke session', { error });
      return toIpcResult(fail({ code: 'REVOKE_ERROR', message: String(error) }));
    }
  }

  async revokeAllSessions(): Promise<{ ok: boolean; count: number }> {
    this.logger.debug('Revoke all sessions');

    if (!this.sessionManager) {
      return { ok: false, count: 0 };
    }

    try {
      const currentSession = this.sessionManager.getCurrentSession();
      if (!currentSession) {
        return { ok: true, count: 0 };
      }

      const count = await this.sessionManager.cleanupOtherSessions(currentSession.identityId);
      return { ok: true, count };
    } catch (error) {
      this.logger.error('Failed to revoke all sessions', { error });
      return { ok: false, count: 0 };
    }
  }

  // ============================================
  // Devices Methods
  // ============================================

  async listDevices(): Promise<{ devices: DeviceInfoUI[]; total: number }> {
    this.logger.debug('List devices');

    const deviceInfo = this.sessionManager?.getDeviceInfo();
    if (!deviceInfo) {
      return { devices: [], total: 0 };
    }

    const currentDevice: DeviceInfoUI = {
      id: deviceInfo.deviceId,
      name: deviceInfo.deviceName ?? 'Desktop App',
      type: deviceInfo.deviceType,
      os: deviceInfo.os ?? undefined,
      fingerprint: deviceInfo.deviceFingerprint ?? undefined,
    };

    return { devices: [currentDevice], total: 1 };
  }

  async getCurrentDevice(): Promise<DeviceInfoUI> {
    this.logger.debug('Get current device');

    const deviceInfo = this.sessionManager?.getDeviceInfo();
    if (!deviceInfo) {
      return {
        id: 'unknown',
        name: 'Desktop App',
        type: 'DESKTOP',
      };
    }

    return {
      id: deviceInfo.deviceId,
      name: deviceInfo.deviceName ?? 'Desktop App',
      type: deviceInfo.deviceType,
      os: deviceInfo.os ?? undefined,
      fingerprint: deviceInfo.deviceFingerprint ?? undefined,
    };
  }

  async revokeDevice(deviceId: string): Promise<IpcResult<void>> {
    this.logger.debug('Revoke device', { deviceId });

    const currentDevice = this.sessionManager?.getDeviceInfo();
    if (currentDevice && deviceId === currentDevice.deviceId) {
      return toIpcResult(fail({ code: 'INVALID_OPERATION', message: '无法撤销当前设备' }));
    }

    return toIpcResult(fail({ code: 'NOT_IMPLEMENTED', message: '跨设备撤销尚未实现' }));
  }

  async renameDevice(deviceId: string, name: string): Promise<IpcResult<void>> {
    this.logger.debug('Rename device', { deviceId, name });

    return toIpcResult(ok(undefined));
  }

  // ===== Private Helpers =====

  private getCurrentIdentityId(): string | null {
    if (this.authState.runtimeState === AuthRuntimeState.RESTORING) {
      return null;
    }

    const currentSession = this.sessionManager?.getCurrentSession();
    if (currentSession?.identityId) {
      return currentSession.identityId;
    }

    const tokenData = this.tokenManager.getCachedTokenData();
    return tokenData?.identityId ?? null;
  }
}
