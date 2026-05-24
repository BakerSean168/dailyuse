import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  loginDesktopAccount: vi.fn(),
  registerDesktopAccount: vi.fn(),
  refreshDesktopSession: vi.fn(),
  getTokenManager: vi.fn(),
  getRememberedAccountsService: vi.fn(),
  getNetworkStateManager: vi.fn(),
  getWindowManager: vi.fn(),
  createSessionManager: vi.fn(),
}));

vi.mock('../login-desktop-account', () => ({
  loginDesktopAccount: mocks.loginDesktopAccount,
}));

vi.mock('../register-desktop-account', () => ({
  registerDesktopAccount: mocks.registerDesktopAccount,
}));

vi.mock('../refresh-desktop-session', () => ({
  refreshDesktopSession: mocks.refreshDesktopSession,
}));

vi.mock('../../infrastructure', () => ({
  getTokenManager: mocks.getTokenManager,
  getRememberedAccountsService: mocks.getRememberedAccountsService,
  getNetworkStateManager: mocks.getNetworkStateManager,
  createSessionManager: mocks.createSessionManager,
  TokenManager: class {},
  SessionManager: class {},
}));

vi.mock('../../../../lifecycle/window-manager', () => ({
  getWindowManager: mocks.getWindowManager,
}));

import { DesktopCredentialAuthCoordinator } from '../desktop-credential-auth-coordinator';
import type { AuthState } from '../desktop-credential-auth-coordinator';

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

function createAuthResponseDTO(overrides: Record<string, any> = {}) {
  return {
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-456',
    identity: {
      id: 'identity-1',
      status: 'Active',
      identifiers: [{ type: 'Email', value: 'user@example.com' }],
      credentials: [],
      hasPassword: true,
      hasEmail: true,
      hasPhone: false,
      hasOAuth: false,
      failedLoginAttempts: 0,
      lastFailedAttempt: null,
      lockedUntil: null,
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
    },
    session: {
      id: 'session-1',
      identityId: 'identity-1',
      deviceInfo: {
        deviceId: 'device-1',
        deviceFingerprint: 'fp',
        deviceType: 'Desktop',
        deviceName: 'Test',
        os: null,
        osVersion: null,
        browser: null,
        appVersion: null,
        ipAddress: null,
        userAgent: null,
        location: null,
        firstSeenAt: Date.now(),
        lastSeenAt: Date.now(),
      },
      isCurrentSession: true,
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      expiresAt: Date.now() + 3600_000,
      lastActiveAt: Date.now(),
      deletedAt: null,
    },
    ...overrides,
  };
}

const mockRemoteGateway = {
  createLoginUrl: () => '',
  login: vi.fn(),
  createRegisterUrl: () => '',
  register: vi.fn(),
  createRefreshUrl: () => '',
  refreshToken: vi.fn(),
};

function createCoordinator(opts: {
  logger?: any;
  sessionManager?: any;
  tokenManager?: any;
  projectionService?: any;
  rememberedAccountService?: any;
  credentialRepo?: any;
  sessionRepo?: any;
  authState?: AuthState;
} = {}) {
  const logger = opts.logger ?? createLogger();
  const tokenManager = opts.tokenManager ?? createMockTokenManager();
  const sessionManager = opts.sessionManager ?? createMockSessionManager();
  const authState = opts.authState ?? { authMode: 'UNAUTHENTICATED', runtimeState: 'UNINITIALIZED' };
  const projectionService = opts.projectionService ?? {
    ensureAccountProjection: vi.fn().mockResolvedValue(undefined),
    checkActiveLocalConflict: vi.fn().mockResolvedValue(null),
    extractNickname: vi.fn().mockReturnValue(null),
    extractIdentityEmail: vi.fn().mockReturnValue(null),
    isGuestTokenData: vi.fn().mockReturnValue(false),
    isLocalOnlyTokenData: vi.fn().mockReturnValue(false),
  };
  const rememberedAccountService = opts.rememberedAccountService ?? {
    getRememberedAccounts: vi.fn().mockResolvedValue([]),
    removeRememberedAccount: vi.fn().mockResolvedValue({ ok: true }),
    findRememberedAccount: vi.fn().mockResolvedValue(null),
    decryptPassword: vi.fn().mockReturnValue(null),
    recordLogin: vi.fn(),
    getAutoLoginAccount: vi.fn().mockResolvedValue(null),
  };

  const coordinator = new DesktopCredentialAuthCoordinator(
    logger,
    tokenManager,
    mockRemoteGateway as any,
    sessionManager,
    projectionService,
    rememberedAccountService,
    opts.credentialRepo ?? null,
    opts.sessionRepo ?? null,
    authState,
  );

  return { coordinator, authState, sessionManager, tokenManager, projectionService, rememberedAccountService };
}

describe('DesktopCredentialAuthCoordinator', () => {
  let mockTokenManager: ReturnType<typeof createMockTokenManager>;
  let mockSessionManager: ReturnType<typeof createMockSessionManager>;
  let mockRememberedAccountService: any;
  let mockProjectionService: any;
  let authState: AuthState;

  beforeEach(() => {
    vi.clearAllMocks();

    mockTokenManager = createMockTokenManager();
    mocks.getTokenManager.mockReturnValue(mockTokenManager);

    mocks.getNetworkStateManager.mockReturnValue({
      isOnline: vi.fn(() => true),
    });
    mocks.getWindowManager.mockReturnValue({
      getMainWindow: vi.fn(() => null),
    });

    mockSessionManager = createMockSessionManager();
    mocks.createSessionManager.mockReturnValue(mockSessionManager);

    authState = { authMode: 'UNAUTHENTICATED', runtimeState: 'UNINITIALIZED' };

    mockRememberedAccountService = {
      getRememberedAccounts: vi.fn().mockResolvedValue([]),
      removeRememberedAccount: vi.fn().mockResolvedValue({ ok: true }),
      findRememberedAccount: vi.fn().mockResolvedValue(null),
      decryptPassword: vi.fn().mockReturnValue(null),
      recordLogin: vi.fn(),
      getAutoLoginAccount: vi.fn().mockResolvedValue(null),
    };

    mockProjectionService = {
      ensureAccountProjection: vi.fn().mockResolvedValue(undefined),
      checkActiveLocalConflict: vi.fn().mockResolvedValue(null),
      extractNickname: vi.fn().mockReturnValue(null),
      extractIdentityEmail: vi.fn().mockReturnValue(null),
      isGuestTokenData: vi.fn().mockReturnValue(false),
      isLocalOnlyTokenData: vi.fn().mockReturnValue(false),
    };
  });

  describe('login', () => {
    it('falls back to loginOffline without re-entering remote login orchestration', async () => {
      mocks.loginDesktopAccount.mockResolvedValue({
        ok: false,
        error: {
          code: 'OFFLINE',
          message: 'OFFLINE',
          shouldFallbackToOffline: true,
        },
      });

      const loginOffline = vi.fn().mockResolvedValue({
        ok: true,
        identityId: 'user-1',
        sessionId: 'session-1',
        accessToken: 'local-token',
        expiresIn: 3600,
      });

      const sm = { ...mockSessionManager, loginOffline, getCurrentSession: vi.fn(() => null) };
      const { coordinator } = createCoordinator({
        logger: createLogger(),
        tokenManager: mockTokenManager,
        sessionManager: sm,
        rememberedAccountService: mockRememberedAccountService,
        projectionService: mockProjectionService,
        authState,
        credentialRepo: {
          findById: vi.fn().mockResolvedValue({
            toClientDTO: () => ({
              id: 'user-1',
              identifiers: [{ type: 'Email', value: 'offline@example.com' }],
            }),
          }),
        },
        sessionRepo: {
          findById: vi.fn().mockResolvedValue({
            toClientDTO: vi.fn().mockReturnValue({
              id: 'session-1',
              identityId: 'user-1',
              deviceInfo: { deviceId: 'd1' },
            }),
          }),
        },
      });

      const result = await coordinator.login({
        email: 'offline@example.com',
        password: 'secret123',
        rememberPassword: false,
        autoLogin: false,
      });

      expect(mocks.loginDesktopAccount).toHaveBeenCalledOnce();
      expect(loginOffline).toHaveBeenCalledOnce();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.authMode).toBe('OFFLINE_USER');
      }
    });

    it('returns a local conflict when the requested account is already open in the main window', async () => {
      mocks.loginDesktopAccount.mockResolvedValue({
        ok: true,
        response: {} as never,
      });

      const conflictProjection = {
        ...mockProjectionService,
        checkActiveLocalConflict: vi.fn().mockResolvedValue({
          code: 'AUTH_ALREADY_ACTIVE_LOCALLY',
          message: '该账号已在本地主窗口中登录',
          context: { identityId: 'user-1', displayName: 'active' },
        }),
      };
      const sm = { ...mockSessionManager, getCurrentSession: vi.fn(() => ({ identityId: 'user-1' })) };
      const credRepo = {
        findByEmail: vi.fn().mockResolvedValue({
          id: 'user-1',
          toClientDTO: () => ({ identifiers: [{ type: 'Email', value: 'active@example.com' }] }),
        }),
      };
      const { coordinator } = createCoordinator({
        logger: createLogger(),
        tokenManager: mockTokenManager,
        sessionManager: sm,
        rememberedAccountService: mockRememberedAccountService,
        projectionService: conflictProjection,
        authState,
        credentialRepo: credRepo,
      });
      authState.runtimeState = 'AUTHENTICATED';
      mocks.getWindowManager.mockReturnValue({
        getMainWindow: vi.fn(() => ({ isDestroyed: () => false })),
      });

      const result = await coordinator.login({
        email: 'active@example.com',
        password: 'secret123',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('AUTH_ALREADY_ACTIVE_LOCALLY');
        expect(result.error.context?.displayName).toBe('active');
      }
      expect(mocks.loginDesktopAccount).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('delegates to registerDesktopAccount and returns success', async () => {
      const responseDTO = createAuthResponseDTO();
      mocks.registerDesktopAccount.mockResolvedValue({
        ok: true,
        response: responseDTO,
      });

      const { coordinator } = createCoordinator({
        logger: createLogger(),
        tokenManager: mockTokenManager,
        sessionManager: mockSessionManager,
        rememberedAccountService: mockRememberedAccountService,
        projectionService: mockProjectionService,
        authState,
      });

      const result = await coordinator.register({
        email: 'new@example.com',
        password: 'pass123',
        username: 'newuser',
      });

      expect(result.ok).toBe(true);
      expect(mocks.registerDesktopAccount).toHaveBeenCalledOnce();
    });

    it('returns failure when registerDesktopAccount fails', async () => {
      mocks.registerDesktopAccount.mockResolvedValue({
        ok: false,
        error: { code: 'CONFLICT', message: 'Email already exists' },
      });

      const { coordinator } = createCoordinator({
        logger: createLogger(),
        tokenManager: mockTokenManager,
        sessionManager: mockSessionManager,
        rememberedAccountService: mockRememberedAccountService,
        projectionService: mockProjectionService,
        authState,
      });

      const result = await coordinator.register({
        email: 'existing@example.com',
        password: 'pass123',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CONFLICT');
      }
    });
  });

  describe('enterGuestMode', () => {
    it('activates guest mode with guest identity', async () => {
      const { coordinator } = createCoordinator({
        logger: createLogger(),
        tokenManager: mockTokenManager,
        sessionManager: mockSessionManager,
        rememberedAccountService: mockRememberedAccountService,
        projectionService: mockProjectionService,
        authState,
      });

      const result = await coordinator.enterGuestMode();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.identityId).toBe('guest-id-1');
        expect(result.data.mode).toBe('GUEST');
      }
      expect(authState.runtimeState).toBe('AUTHENTICATED');
    });

    it('returns GUEST_MODE_ERROR when guest identity creation fails', async () => {
      mockSessionManager.getOrCreateGuestIdentity.mockRejectedValue(
        new Error('Guest creation failed'),
      );

      const { coordinator } = createCoordinator({
        logger: createLogger(),
        tokenManager: mockTokenManager,
        sessionManager: mockSessionManager,
        rememberedAccountService: mockRememberedAccountService,
        projectionService: mockProjectionService,
        authState,
      });

      const result = await coordinator.enterGuestMode();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('GUEST_MODE_ERROR');
      }
    });
  });

  describe('logout', () => {
    it('delegates to session manager and resets state', async () => {
      const { coordinator } = createCoordinator({
        logger: createLogger(),
        tokenManager: mockTokenManager,
        sessionManager: mockSessionManager,
        rememberedAccountService: mockRememberedAccountService,
        projectionService: mockProjectionService,
        authState,
      });

      const result = await coordinator.logout();

      expect(result.ok).toBe(true);
      expect(mockSessionManager.logout).toHaveBeenCalledOnce();
      expect(authState.runtimeState).toBe('UNAUTHENTICATED');
    });

    it('returns LOGOUT_FAILED when session manager logout fails', async () => {
      mockSessionManager.logout.mockResolvedValue({ ok: false, error: 'logout error' });

      const { coordinator } = createCoordinator({
        logger: createLogger(),
        tokenManager: mockTokenManager,
        sessionManager: mockSessionManager,
        rememberedAccountService: mockRememberedAccountService,
        projectionService: mockProjectionService,
        authState,
      });

      const result = await coordinator.logout();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('LOGOUT_FAILED');
      }
    });
  });

  describe('completeRemoteLoginSuccess', () => {
    it('persists session, offline credentials, and remembered account', async () => {
      const responseDTO = createAuthResponseDTO();

      const { coordinator } = createCoordinator({
        logger: createLogger(),
        tokenManager: mockTokenManager,
        sessionManager: mockSessionManager,
        rememberedAccountService: mockRememberedAccountService,
        projectionService: mockProjectionService,
        authState,
      });

      await coordinator.completeRemoteLoginSuccess(responseDTO, {
        email: 'user@example.com',
        password: 'pass123',
        rememberPassword: true,
        autoLogin: false,
      });

      expect(mockSessionManager.activateOnlineSession).toHaveBeenCalledOnce();
      expect(mockSessionManager.saveOfflineCredentials).toHaveBeenCalledWith(
        'user@example.com',
        'pass123',
        'identity-1',
      );
      expect(mockRememberedAccountService.recordLogin).toHaveBeenCalledOnce();
      expect(authState.runtimeState).toBe('AUTHENTICATED');
    });

    it('removes offline credentials when rememberPassword is false', async () => {
      const responseDTO = createAuthResponseDTO();

      const { coordinator } = createCoordinator({
        logger: createLogger(),
        tokenManager: mockTokenManager,
        sessionManager: mockSessionManager,
        rememberedAccountService: mockRememberedAccountService,
        projectionService: mockProjectionService,
        authState,
      });

      await coordinator.completeRemoteLoginSuccess(responseDTO, {
        email: 'user@example.com',
        password: 'pass123',
        rememberPassword: false,
      });

      expect(mockSessionManager.removeOfflineCredentials).toHaveBeenCalledWith('user@example.com');
      expect(mockSessionManager.saveOfflineCredentials).not.toHaveBeenCalled();
    });
  });

  describe('login - online success', () => {
    it('returns ONLINE_USER auth mode on successful remote login', async () => {
      const responseDTO = createAuthResponseDTO();
      mocks.loginDesktopAccount.mockImplementation(async (_req: any, deps: any) => {
        await deps.onSuccess(responseDTO, {
          email: 'user@example.com',
          password: 'pass123',
          rememberPassword: false,
          autoLogin: false,
        });
        return { ok: true, response: responseDTO };
      });

      const { coordinator } = createCoordinator({
        logger: createLogger(),
        tokenManager: mockTokenManager,
        sessionManager: mockSessionManager,
        rememberedAccountService: mockRememberedAccountService,
        projectionService: mockProjectionService,
        authState,
      });

      const result = await coordinator.login({
        email: 'user@example.com',
        password: 'pass123',
        rememberPassword: false,
        autoLogin: false,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.authMode).toBe('ONLINE_USER');
      }
    });
  });
});
