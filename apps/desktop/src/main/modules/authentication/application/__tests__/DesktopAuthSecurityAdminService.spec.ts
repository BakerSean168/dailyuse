import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DesktopAuthSecurityAdminService } from '../DesktopAuthSecurityAdminService';

// =============================================
// Helpers
// =============================================

function createLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
}

function createMockSessionManager(overrides: Record<string, any> = {}) {
  return {
    initialize: vi.fn().mockResolvedValue({ ok: false }),
    getCurrentSession: vi.fn(() => null),
    loginOffline: vi.fn(),
    logout: vi.fn().mockResolvedValue({ ok: true }),
    autoLogin: vi.fn().mockResolvedValue({ ok: false }),
    refreshSession: vi.fn(),
    activateOnlineSession: vi.fn(),
    getOrCreateGuestIdentity: vi.fn().mockResolvedValue('guest-id-1'),
    saveOfflineCredentials: vi.fn().mockResolvedValue(undefined),
    removeOfflineCredentials: vi.fn().mockResolvedValue(undefined),
    cleanupExpiredSessions: vi.fn().mockResolvedValue(0),
    cleanupOtherSessions: vi.fn().mockResolvedValue(0),
    cleanup: vi.fn(),
    getStatus: vi.fn(),
    getDeviceInfo: vi.fn().mockReturnValue({
      deviceId: 'device-1',
      deviceName: 'Test Desktop',
      deviceType: 'DESKTOP',
      deviceFingerprint: 'fp-123',
      os: 'Windows',
    }),
    ensureCurrentSession: vi.fn(),
    syncCurrentSessionExpiry: vi.fn(),
    setApiCallbacks: vi.fn(),
    setOfflineAuthDependencies: vi.fn(),
    ...overrides,
  };
}

function createMockTokenManager(overrides: Record<string, any> = {}) {
  return {
    loadTokens: vi.fn().mockResolvedValue(null),
    updateAccessToken: vi.fn(),
    updateRefreshToken: vi.fn(),
    getCachedTokenData: vi.fn().mockReturnValue(null),
    getStatus: vi.fn().mockResolvedValue({
      isRefreshTokenExpired: false,
      isAccessTokenExpired: false,
    }),
    getAccessToken: vi.fn().mockResolvedValue(null),
    clearTokens: vi.fn(),
    ...overrides,
  };
}

function createAuthState() {
  return { authMode: 'UNAUTHENTICATED' as string, runtimeState: 'UNINITIALIZED' as string };
}

function createService(opts: {
  logger?: any;
  sessionManager?: any;
  tokenManager?: any;
  credentialRepo?: any;
  sessionRepo?: any;
  authState?: any;
} = {}) {
  const logger = opts.logger ?? createLogger();
  const tokenManager = opts.tokenManager ?? createMockTokenManager();
  const authState = opts.authState ?? createAuthState();

  return new DesktopAuthSecurityAdminService(
    logger,
    opts.sessionManager ?? null,
    tokenManager,
    opts.credentialRepo ?? null,
    opts.sessionRepo ?? null,
    authState,
  );
}

// =============================================
// Tests
// =============================================

describe('DesktopAuthSecurityAdminService', () => {
  let mockSessionManager: ReturnType<typeof createMockSessionManager>;
  let mockTokenManager: ReturnType<typeof createMockTokenManager>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionManager = createMockSessionManager();
    mockTokenManager = createMockTokenManager();
  });

  // =============================================
  // session management
  // =============================================

  describe('session management', () => {
    it('lists sessions for current identity', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          identityId: 'user-1',
          toClientDTO: vi.fn().mockReturnValue({ id: 'session-1', identityId: 'user-1' }),
        },
        {
          id: 'session-2',
          identityId: 'user-1',
          toClientDTO: vi.fn().mockReturnValue({ id: 'session-2', identityId: 'user-1' }),
        },
      ];

      mockSessionManager.getCurrentSession.mockReturnValue({
        identityId: 'user-1',
        id: 'session-1',
      });

      const service = createService({
        sessionManager: mockSessionManager,
        sessionRepo: { findByIdentityId: vi.fn().mockResolvedValue(mockSessions) },
      });

      const result = await service.listSessions();

      expect(result.sessions).toHaveLength(2);
    });

    it('returns empty sessions when no current session', async () => {
      const service = createService({ sessionManager: mockSessionManager });

      const result = await service.listSessions();

      expect(result.sessions).toHaveLength(0);
    });

    it('revokes a specific session', async () => {
      const mockSession = {
        id: 'session-2',
        revoke: vi.fn(),
      };

      mockSessionManager.getCurrentSession.mockReturnValue({
        identityId: 'user-1',
        id: 'session-1',
      });

      const service = createService({
        sessionManager: mockSessionManager,
        sessionRepo: {
          findById: vi.fn().mockResolvedValue(mockSession),
          save: vi.fn(),
        },
      });

      const result = await service.revokeSession('session-2');

      expect(result.ok).toBe(true);
      expect(mockSession.revoke).toHaveBeenCalledOnce();
    });

    it('prevents revoking the current session', async () => {
      const mockSession = {
        id: 'session-1',
        revoke: vi.fn(),
      };

      mockSessionManager.getCurrentSession.mockReturnValue({
        identityId: 'user-1',
        id: 'session-1',
      });

      const service = createService({
        sessionManager: mockSessionManager,
        sessionRepo: {
          findById: vi.fn().mockResolvedValue(mockSession),
        },
      });

      const result = await service.revokeSession('session-1');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_OPERATION');
      }
      expect(mockSession.revoke).not.toHaveBeenCalled();
    });

    it('returns VALIDATION_ERROR when sessionId is missing', async () => {
      const service = createService({ sessionRepo: {} });

      const result = await service.revokeSession();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('revokes all sessions except current', async () => {
      mockSessionManager.getCurrentSession.mockReturnValue({
        identityId: 'user-1',
        id: 'session-1',
      });
      mockSessionManager.cleanupOtherSessions.mockResolvedValue(3);

      const service = createService({ sessionManager: mockSessionManager });

      const result = await service.revokeAllSessions();

      expect(result.ok).toBe(true);
      expect(result.count).toBe(3);
    });
  });

  // =============================================
  // device management
  // =============================================

  describe('device management', () => {
    it('lists current device', async () => {
      const service = createService({ sessionManager: mockSessionManager });

      const result = await service.listDevices();

      expect(result.devices).toHaveLength(1);
      expect(result.devices[0].id).toBe('device-1');
      expect(result.total).toBe(1);
    });

    it('returns empty devices when session manager has no device info', async () => {
      mockSessionManager.getDeviceInfo.mockReturnValue(null);

      const service = createService({ sessionManager: mockSessionManager });

      const result = await service.listDevices();

      expect(result.devices).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('returns current device info', async () => {
      const service = createService({ sessionManager: mockSessionManager });

      const device = await service.getCurrentDevice();

      expect(device.id).toBe('device-1');
      expect(device.name).toBe('Test Desktop');
      expect(device.type).toBe('DESKTOP');
    });

    it('returns fallback device info when session manager has no device info', async () => {
      mockSessionManager.getDeviceInfo.mockReturnValue(null);

      const service = createService({ sessionManager: mockSessionManager });

      const device = await service.getCurrentDevice();

      expect(device.id).toBe('unknown');
      expect(device.name).toBe('Desktop App');
    });

    it('prevents revoking the current device', async () => {
      const service = createService({ sessionManager: mockSessionManager });

      const result = await service.revokeDevice('device-1');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_OPERATION');
      }
    });

    it('returns NOT_IMPLEMENTED for revoking other devices', async () => {
      const service = createService({ sessionManager: mockSessionManager });

      const result = await service.revokeDevice('other-device');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_IMPLEMENTED');
      }
    });

    it('renameDevice returns ok (no-op)', async () => {
      const service = createService();
      const result = await service.renameDevice('device-1', 'New Name');

      expect(result.ok).toBe(true);
    });
  });

  // =============================================
  // 2FA stubs
  // =============================================

  describe('2FA stubs', () => {
    it('enable2FA returns NOT_IMPLEMENTED for online users', async () => {
      const authState = createAuthState();
      authState.authMode = 'ONLINE_USER';
      const service = createService({ authState });

      const result = await service.enable2FA('totp');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_IMPLEMENTED');
      }
    });

    it('enable2FA returns ONLINE_REQUIRED for non-online users', async () => {
      const service = createService();

      const result = await service.enable2FA('totp');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('ONLINE_REQUIRED');
      }
    });

    it('disable2FA returns NOT_IMPLEMENTED', async () => {
      const service = createService();
      const result = await service.disable2FA();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_IMPLEMENTED');
      }
    });

    it('verify2FA returns NOT_IMPLEMENTED', async () => {
      const service = createService();
      const result = await service.verify2FA('123456');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_IMPLEMENTED');
      }
    });

    it('get2FAStatus returns disabled status', async () => {
      const service = createService();
      const result = await service.get2FAStatus();

      expect(result).toEqual({ enabled: false, method: null });
    });

    it('generateBackupCodes returns empty codes', async () => {
      const service = createService();
      const result = await service.generateBackupCodes();

      expect(result).toEqual({ codes: [] });
    });
  });

  // =============================================
  // API key stubs
  // =============================================

  describe('API key stubs', () => {
    it('createApiKey returns null for non-online users', async () => {
      const service = createService();
      const result = await service.createApiKey({ name: 'test-key' });

      expect(result).toBeNull();
    });

    it('listApiKeys returns empty list', async () => {
      const service = createService();
      const result = await service.listApiKeys();

      expect(result).toEqual({ apiKeys: [], total: 0 });
    });

    it('revokeApiKey returns NOT_IMPLEMENTED', async () => {
      const service = createService();
      const result = await service.revokeApiKey('key-1');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_IMPLEMENTED');
      }
    });

    it('rotateApiKey returns null newKey', async () => {
      const service = createService();
      const result = await service.rotateApiKey('key-1');

      expect(result).toEqual({ newKey: null });
    });
  });

  // =============================================
  // getCurrentUser
  // =============================================

  describe('getCurrentUser', () => {
    it('returns identity and session from repositories', async () => {
      mockSessionManager.getCurrentSession.mockReturnValue({
        identityId: 'user-1',
        id: 'session-1',
        toClientDTO: vi.fn().mockReturnValue({ id: 'session-1', identityId: 'user-1' }),
      });

      const service = createService({
        sessionManager: mockSessionManager,
        credentialRepo: {
          findById: vi.fn().mockResolvedValue({
            toClientDTO: () => ({
              id: 'user-1',
              identifiers: [{ type: 'Email', value: 'user@example.com' }],
            }),
          }),
        },
      });

      const result = await service.getCurrentUser();

      expect(result.identity).toBeDefined();
      expect(result.session).toBeDefined();
    });

    it('returns fallback identity when repository lookup fails', async () => {
      mockSessionManager.getCurrentSession.mockReturnValue({
        identityId: 'user-1',
        id: 'sess-1',
        isValid: () => true,
        deviceInfo: { deviceId: 'dev-1', deviceType: 'DESKTOP' },
        toClientDTO: () => ({ id: 'sess-1', identityId: 'user-1', isCurrentSession: true }),
      });

      const service = createService({
        sessionManager: mockSessionManager,
        credentialRepo: { findById: vi.fn().mockResolvedValue(null) },
      });

      const result = await service.getCurrentUser();

      expect(result.identity.id).toBe('user-1');
      expect(result.session).toBeDefined();
    });

    it('falls back to token cache when no session exists', async () => {
      mockSessionManager.getCurrentSession.mockReturnValue(null);
      const mockTokenMgr = createMockTokenManager({
        getCachedTokenData: vi.fn().mockReturnValue({ identityId: 'cached-user' }),
      });

      const service = createService({
        sessionManager: mockSessionManager,
        tokenManager: mockTokenMgr,
      });

      const result = await service.getCurrentUser();

      expect(result.identity.id).toBe('cached-user');
      expect(result.session).toBeNull();
    });
  });
});
