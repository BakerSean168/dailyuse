import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ILogger } from '@dailyuse/utils/logger';
import type { IAuthIdentityRepository, IAuthSessionRepository } from '@dailyuse/authentication/electron';
import type { TokenManager } from '../../infrastructure/token-manager';
import type { SessionManager } from '../../infrastructure/session-manager';
import type { NetworkStateManager } from '../../infrastructure/network-state-manager';
import type { AuthRemoteGateway } from '../auth-remote-gateway';
import type { DesktopAuthAccountProjectionService } from '../desktop-auth-account-projection-service';
import type { DesktopRememberedAccountService } from '../desktop-remembered-account-service';
import type { AuthState } from '../desktop-credential-auth-coordinator';

const mocks = vi.hoisted(() => ({
  refreshDesktopSession: vi.fn(),
}));

vi.mock('../refresh-desktop-session', () => ({
  refreshDesktopSession: mocks.refreshDesktopSession,
}));

vi.mock('../../infrastructure', () => ({
  TokenManager: class {},
  SessionManager: class {},
  NetworkStateManager: class {},
}));

import { DesktopAuthLifecycleCoordinator } from '../desktop-auth-lifecycle-coordinator';
import {
  createMockLogger,
  createMockSessionManager,
  createMockTokenManager,
  createMockNetworkStateManager,
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

function createCoordinator(
  logger: ILogger,
  tokenManager: TokenManager,
  networkStateManager: NetworkStateManager,
  sessionManager: SessionManager | null,
  projectionService: DesktopAuthAccountProjectionService,
  rememberedAccountService: DesktopRememberedAccountService,
  authState: AuthState,
  isInitializedRef: { value: boolean },
  credentialRepo: IAuthIdentityRepository | null = null,
  sessionRepo: IAuthSessionRepository | null = null,
) {
  return new DesktopAuthLifecycleCoordinator(
    logger,
    tokenManager,
    networkStateManager,
    mockRemoteGateway as unknown as AuthRemoteGateway,
    sessionManager,
    projectionService,
    rememberedAccountService,
    credentialRepo,
    sessionRepo,
    authState,
    isInitializedRef,
  );
}

describe('DesktopAuthLifecycleCoordinator', () => {
  let mockTokenManager: ReturnType<typeof createMockTokenManager>;
  let mockSessionManager: ReturnType<typeof createMockSessionManager>;
  let mockNetworkStateManager: ReturnType<typeof createMockNetworkStateManager>;
  let mockRememberedAccountService: DesktopRememberedAccountService;
  let mockProjectionService: DesktopAuthAccountProjectionService;
  let authState: AuthState;
  let isInitializedRef: { value: boolean };

  beforeEach(() => {
    vi.clearAllMocks();

    mockTokenManager = createMockTokenManager();
    mockSessionManager = createMockSessionManager();
    mockNetworkStateManager = createMockNetworkStateManager();

    authState = { authMode: 'UNAUTHENTICATED', runtimeState: 'UNINITIALIZED' };
    isInitializedRef = { value: false };

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

  // =============================================
  // initialize
  // =============================================

  describe('initialize', () => {
    it('restores session and resolves auth mode from token data', async () => {
      mockSessionManager.initialize.mockResolvedValue({
        ok: true,
        session: { identityId: 'user-1', id: 'session-1', isValid: () => true },
        identityId: 'user-1',
      });
      mockTokenManager.loadTokens.mockResolvedValue({
        accessToken: 'online-token',
        refreshToken: 'online-refresh',
        identityId: 'user-1',
        sessionId: 'session-1',
      });

      const coordinator = createCoordinator(
        createMockLogger(), mockTokenManager, mockNetworkStateManager, mockSessionManager,
        mockProjectionService, mockRememberedAccountService, authState, isInitializedRef,
      );

      const result = await coordinator.initialize();

      expect(result.ok).toBe(true);
      expect(result.hasValidSession).toBe(true);
      expect(authState.runtimeState).toBe('AUTHENTICATED');
    });

    it('returns UNAUTHENTICATED when no session is restored', async () => {
      mockSessionManager.initialize.mockResolvedValue({ ok: false });

      const coordinator = createCoordinator(
        createMockLogger(), mockTokenManager, mockNetworkStateManager, mockSessionManager,
        mockProjectionService, mockRememberedAccountService, authState, isInitializedRef,
      );

      const result = await coordinator.initialize();

      expect(result.ok).toBe(true);
      expect(result.hasValidSession).toBe(false);
      expect(authState.runtimeState).toBe('UNAUTHENTICATED');
    });

    it('skips re-initialization if already initialized', async () => {
      isInitializedRef.value = true;
      authState.runtimeState = 'AUTHENTICATED';

      const coordinator = createCoordinator(
        createMockLogger(), mockTokenManager, mockNetworkStateManager, mockSessionManager,
        mockProjectionService, mockRememberedAccountService, authState, isInitializedRef,
      );

      const result = await coordinator.initialize();

      expect(result.success).toBe(true);
      expect(mockSessionManager.initialize).not.toHaveBeenCalled();
    });

    it('runs in minimal mode when no session manager is available', async () => {
      const coordinator = createCoordinator(
        createMockLogger(), mockTokenManager, mockNetworkStateManager, null,
        mockProjectionService, mockRememberedAccountService, authState, isInitializedRef,
      );

      const result = await coordinator.initialize();

      expect(result.ok).toBe(true);
      expect(result.hasValidSession).toBe(false);
      expect(authState.runtimeState).toBe('UNAUTHENTICATED');
    });

    it('handles initialize errors gracefully', async () => {
      mockSessionManager.initialize.mockRejectedValue(new Error('DB failure'));

      const coordinator = createCoordinator(
        createMockLogger(), mockTokenManager, mockNetworkStateManager, mockSessionManager,
        mockProjectionService, mockRememberedAccountService, authState, isInitializedRef,
      );

      const result = await coordinator.initialize();

      expect(result.ok).toBe(false);
      expect(result.needsReLogin).toBe(true);
      expect(authState.runtimeState).toBe('UNAUTHENTICATED');
    });
  });

  // =============================================
  // autoLogin
  // =============================================

  describe('autoLogin', () => {
    it('returns not authenticated when no auto-login account is remembered', async () => {
      const coordinator = createCoordinator(
        createMockLogger(), mockTokenManager, mockNetworkStateManager, mockSessionManager,
        mockProjectionService, mockRememberedAccountService, authState, isInitializedRef,
      );

      const result = await coordinator.autoLogin();

      expect(result.ok).toBe(true);
      expect(result.authenticated).toBe(false);
    });

    it('returns existing session if already valid', async () => {
      mockRememberedAccountService.getAutoLoginAccount.mockResolvedValue({
        identityId: 'user-1',
        identifier: 'user@example.com',
      });
      mockSessionManager.getCurrentSession.mockReturnValue({
        identityId: 'user-1',
        id: 'session-1',
        isValid: () => true,
      });
      isInitializedRef.value = true;

      const coordinator = createCoordinator(
        createMockLogger(), mockTokenManager, mockNetworkStateManager, mockSessionManager,
        mockProjectionService, mockRememberedAccountService, authState, isInitializedRef,
      );

      const result = await coordinator.autoLogin();

      expect(result.ok).toBe(true);
      expect(result.authenticated).toBe(true);
      expect(result.identityId).toBe('user-1');
    });

    it('delegates to sessionManager.autoLogin when no valid session exists', async () => {
      mockRememberedAccountService.getAutoLoginAccount.mockResolvedValue({
        identityId: 'user-1',
        identifier: 'user@example.com',
      });
      mockSessionManager.autoLogin.mockResolvedValue({
        ok: true,
        session: { identityId: 'user-1', id: 'session-1' },
        identityId: 'user-1',
      });
      mockTokenManager.loadTokens.mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });
      isInitializedRef.value = true;

      const coordinator = createCoordinator(
        createMockLogger(), mockTokenManager, mockNetworkStateManager, mockSessionManager,
        mockProjectionService, mockRememberedAccountService, authState, isInitializedRef,
      );

      const result = await coordinator.autoLogin();

      expect(result.ok).toBe(true);
      expect(result.authenticated).toBe(true);
      expect(mockSessionManager.autoLogin).toHaveBeenCalledOnce();
    });

    it('returns not authenticated when sessionManager is null', async () => {
      const coordinator = createCoordinator(
        createMockLogger(), mockTokenManager, mockNetworkStateManager, null,
        mockProjectionService, mockRememberedAccountService, authState, isInitializedRef,
      );

      const result = await coordinator.autoLogin();

      expect(result.ok).toBe(false);
      expect(result.authenticated).toBe(false);
    });
  });

  // =============================================
  // refreshToken
  // =============================================

  describe('refreshToken', () => {
    it('refreshes online successfully', async () => {
      const responseDTO = createAuthResponseDTO();
      mockTokenManager.loadTokens.mockResolvedValue({
        accessToken: 'old-token',
        refreshToken: 'old-refresh',
        sessionId: 'session-1',
        identityId: 'user-1',
      });
      mocks.refreshDesktopSession.mockResolvedValue({
        ok: true,
        response: responseDTO,
      });

      const coordinator = createCoordinator(
        createMockLogger(), mockTokenManager, mockNetworkStateManager, mockSessionManager,
        mockProjectionService, mockRememberedAccountService, authState, isInitializedRef,
      );

      const result = await coordinator.refreshToken();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.accessToken).toBe('access-token-123');
      }
      expect(authState.authMode).toBe('ONLINE_USER');
      expect(authState.runtimeState).toBe('AUTHENTICATED');
    });

    it('falls back to offline refresh when remote is unreachable', async () => {
      mockTokenManager.loadTokens.mockResolvedValue({
        accessToken: 'local-token',
        refreshToken: 'local-refresh',
        sessionId: 'session-1',
        identityId: 'user-1',
      });
      mocks.refreshDesktopSession.mockResolvedValue({
        ok: false,
        error: { code: 'OFFLINE', shouldFallbackToOffline: true, message: 'Offline' },
      });
      mockSessionManager.refreshSession.mockResolvedValue({ ok: true });

      const credRepo = {
        findById: vi.fn().mockResolvedValue({
          toClientDTO: () => ({
            id: 'user-1',
            identifiers: [{ type: 'Email', value: 'offline@example.com' }],
          }),
        }),
      };
      const sessRepo = {
        findById: vi.fn().mockResolvedValue({
          toClientDTO: () => ({
            id: 'session-1',
            identityId: 'user-1',
            deviceInfo: { deviceId: 'd1' },
          }),
        }),
      };

      const coordinator = createCoordinator(
        createMockLogger(), mockTokenManager, mockNetworkStateManager, mockSessionManager,
        mockProjectionService, mockRememberedAccountService, authState, isInitializedRef,
        credRepo, sessRepo,
      );

      const result = await coordinator.refreshToken();

      expect(result.ok).toBe(true);
      expect(mockSessionManager.refreshSession).toHaveBeenCalledOnce();
      expect(authState.authMode).toBe('OFFLINE_USER');
      expect(authState.runtimeState).toBe('AUTHENTICATED');
    });

    it('returns REFRESH_FAILED when no tokens exist', async () => {
      mockTokenManager.loadTokens.mockResolvedValue(null);

      const coordinator = createCoordinator(
        createMockLogger(), mockTokenManager, mockNetworkStateManager, mockSessionManager,
        mockProjectionService, mockRememberedAccountService, authState, isInitializedRef,
      );

      const result = await coordinator.refreshToken();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('REFRESH_FAILED');
      }
    });

    it('returns NOT_INITIALIZED when session manager is missing', async () => {
      const coordinator = createCoordinator(
        createMockLogger(), mockTokenManager, mockNetworkStateManager, null,
        mockProjectionService, mockRememberedAccountService, authState, isInitializedRef,
      );

      const result = await coordinator.refreshToken();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_INITIALIZED');
      }
    });
  });

  // =============================================
  // getStatus
  // =============================================

  describe('getStatus', () => {
    it('returns authenticated status with user and session info', async () => {
      const now = Date.now();
      mockSessionManager.getCurrentSession.mockReturnValue({
        identityId: 'user-1',
        id: 'session-1',
        isValid: () => true,
        deviceInfo: { deviceName: 'Desktop', deviceType: 'DESKTOP', ipAddress: '127.0.0.1' },
        createdAt: now,
        lastActiveAt: now,
        expiresAt: now + 3600_000,
      });

      const coordinator = createCoordinator(
        createMockLogger(), mockTokenManager, mockNetworkStateManager, mockSessionManager,
        mockProjectionService, mockRememberedAccountService, authState, isInitializedRef,
      );

      const status = await coordinator.getStatus();

      expect(status.authenticated).toBe(true);
      expect(status.mode).toBe('UNAUTHENTICATED'); // default, no login happened
      expect(status.user).toEqual({ id: 'user-1' });
      expect(status.session).toBeDefined();
      expect(status.session!.id).toBe('session-1');
    });

    it('returns unauthenticated status when no session exists', async () => {
      const coordinator = createCoordinator(
        createMockLogger(), mockTokenManager, mockNetworkStateManager, mockSessionManager,
        mockProjectionService, mockRememberedAccountService, authState, isInitializedRef,
      );

      const status = await coordinator.getStatus();

      expect(status.authenticated).toBe(false);
      expect(status.user).toBeNull();
      expect(status.session).toBeNull();
    });
  });

  // =============================================
  // buildBootstrapSnapshot
  // =============================================

  describe('buildBootstrapSnapshot', () => {
    it('returns status and current user when authenticated', async () => {
      const now = Date.now();
      mockSessionManager.getCurrentSession.mockReturnValue({
        identityId: 'user-1',
        id: 'session-1',
        isValid: () => true,
        deviceInfo: { deviceName: 'Desktop', deviceType: 'DESKTOP', ipAddress: '' },
        createdAt: now,
        lastActiveAt: now,
        expiresAt: now + 3600_000,
        toClientDTO: vi.fn().mockReturnValue({ id: 'session-1', identityId: 'user-1' }),
      });

      const credRepo = {
        findById: vi.fn().mockResolvedValue({
          toClientDTO: () => ({
            id: 'user-1',
            identifiers: [{ type: 'Email', value: 'user@example.com' }],
          }),
        }),
      };

      const coordinator = createCoordinator(
        createMockLogger(), mockTokenManager, mockNetworkStateManager, mockSessionManager,
        mockProjectionService, mockRememberedAccountService, authState, isInitializedRef,
        credRepo,
      );

      const snapshot = await coordinator.buildBootstrapSnapshot();

      expect(snapshot.status).toBeDefined();
      expect(snapshot.status.authenticated).toBe(true);
      expect(snapshot.currentUser).toBeDefined();
    });
  });

  // =============================================
  // cleanup
  // =============================================

  describe('cleanup', () => {
    it('cleanup resets state and calls session manager cleanup', async () => {
      const coordinator = createCoordinator(
        createMockLogger(), mockTokenManager, mockNetworkStateManager, mockSessionManager,
        mockProjectionService, mockRememberedAccountService, authState, isInitializedRef,
      );

      coordinator.cleanup();

      expect(mockSessionManager.cleanup).toHaveBeenCalledOnce();
      expect(isInitializedRef.value).toBe(false);
    });
  });
});
