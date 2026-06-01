import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthRemoteGateway } from '../auth-remote-gateway';
import type { DesktopAuthAccountProjectionService } from '../desktop-auth-account-projection-service';
import type { DesktopRememberedAccountService } from '../desktop-remembered-account-service';

const mocks = vi.hoisted(() => ({
  loginDesktopAccount: vi.fn(),
  registerDesktopAccount: vi.fn(),
  refreshDesktopSession: vi.fn(),
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
  TokenManager: class {},
  SessionManager: class {},
  NetworkStateManager: class {},
}));

import { DesktopCredentialAuthCoordinator } from '../desktop-credential-auth-coordinator';
import type { AuthState, CredentialAuthCoordinatorDeps } from '../desktop-credential-auth-coordinator';
import {
  createMockLogger,
  createMockSessionManager,
  createMockTokenManager,
} from '../../__fixtures__/auth-test-fixtures';

function createAuthResponseDTO(overrides: Record<string, unknown> = {}): Record<string, unknown> {
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
  logger?: ReturnType<typeof createMockLogger>;
  sessionManager?: ReturnType<typeof createMockSessionManager>;
  tokenManager?: ReturnType<typeof createMockTokenManager>;
  networkStateManager?: { isOnline: ReturnType<typeof vi.fn> };
  projectionService?: DesktopAuthAccountProjectionService;
  rememberedAccountService?: DesktopRememberedAccountService;
  credentialRepo?: Record<string, unknown> | null;
  sessionRepo?: Record<string, unknown> | null;
  authState?: AuthState;
  windowManager?: { getMainWindow: ReturnType<typeof vi.fn> };
} = {}) {
  const logger = opts.logger ?? createMockLogger();
  const tokenManager = opts.tokenManager ?? createMockTokenManager();
  const networkStateManager = opts.networkStateManager ?? { isOnline: vi.fn(() => true) };
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

  const windowManager = opts.windowManager ?? {
    getMainWindow: vi.fn(() => null),
  };

  const coordinator = new DesktopCredentialAuthCoordinator({
    logger,
    tokenManager,
    networkStateManager,
    remoteGateway: mockRemoteGateway as unknown as AuthRemoteGateway,
    sessionManager,
    projectionService,
    rememberedAccountService,
    credentialRepository: opts.credentialRepo ?? null,
    sessionRepository: opts.sessionRepo ?? null,
    authState,
    windowManager: windowManager as unknown as CredentialAuthCoordinatorDeps['windowManager'],
  });

  return { coordinator, authState, sessionManager, tokenManager, projectionService, rememberedAccountService };
}

describe('DesktopCredentialAuthCoordinator', () => {
  let mockTokenManager: ReturnType<typeof createMockTokenManager>;
  let mockSessionManager: ReturnType<typeof createMockSessionManager>;
  let mockRememberedAccountService: DesktopRememberedAccountService;
  let mockProjectionService: DesktopAuthAccountProjectionService;
  let authState: AuthState;

  beforeEach(() => {
    vi.clearAllMocks();

    mockTokenManager = createMockTokenManager();

    mockSessionManager = createMockSessionManager();

    authState = { authMode: 'UNAUTHENTICATED', runtimeState: 'UNINITIALIZED' };

    mockRememberedAccountService = {
      getRememberedAccounts: vi.fn().mockResolvedValue([]),
      removeRememberedAccount: vi.fn().mockResolvedValue({ ok: true }),
      findRememberedAccount: vi.fn().mockResolvedValue(null),
      decryptPassword: vi.fn().mockReturnValue(null),
      recordLogin: vi.fn(),
      getAutoLoginAccount: vi.fn().mockResolvedValue(null),
    } as unknown as DesktopRememberedAccountService;

    mockProjectionService = {
      ensureAccountProjection: vi.fn().mockResolvedValue(undefined),
      checkActiveLocalConflict: vi.fn().mockResolvedValue(null),
      extractNickname: vi.fn().mockReturnValue(null),
      extractIdentityEmail: vi.fn().mockReturnValue(null),
      isGuestTokenData: vi.fn().mockReturnValue(false),
      isLocalOnlyTokenData: vi.fn().mockReturnValue(false),
    } as unknown as DesktopAuthAccountProjectionService;
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
        logger: createMockLogger(),
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
        logger: createMockLogger(),
        tokenManager: mockTokenManager,
        sessionManager: sm,
        rememberedAccountService: mockRememberedAccountService,
        projectionService: conflictProjection,
        authState,
        credentialRepo: credRepo,
        windowManager: {
          getMainWindow: vi.fn(() => ({ isDestroyed: () => false })),
        },
      });
      authState.runtimeState = 'AUTHENTICATED';

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
        logger: createMockLogger(),
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
        logger: createMockLogger(),
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
        logger: createMockLogger(),
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
        logger: createMockLogger(),
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
        logger: createMockLogger(),
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
        logger: createMockLogger(),
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
        logger: createMockLogger(),
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
        logger: createMockLogger(),
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
      mocks.loginDesktopAccount.mockImplementation(async (_req: unknown, deps: { onSuccess: (...args: unknown[]) => Promise<void> }) => {
        await deps.onSuccess(responseDTO, {
          email: 'user@example.com',
          password: 'pass123',
          rememberPassword: false,
          autoLogin: false,
        });
        return { ok: true, response: responseDTO };
      });

      const { coordinator } = createCoordinator({
        logger: createMockLogger(),
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
