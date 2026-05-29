import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sessionManagerInstance: null as unknown,
}));

vi.mock('../../infrastructure', () => ({
  TokenManager: class {},
  SessionManager: class {
    constructor() {
      return mocks.sessionManagerInstance;
    }
  },
}));

import { AuthDesktopApplicationService } from '../auth-desktop-application-service';
import {
  createMockLogger,
  createMockSessionManager,
  createMockTokenManager,
} from '../../__fixtures__/auth-test-fixtures';

function createMockRememberedAccountsService() {
  return {
    list: vi.fn().mockResolvedValue([]),
    getAutoLoginAccount: vi.fn().mockResolvedValue(null),
    remove: vi.fn(),
    decryptPassword: vi.fn(),
    recordLogin: vi.fn(),
    setFilePath: vi.fn(),
  };
}

function createMockNetworkStateManager() {
  return {
    isOnline: vi.fn(() => true),
    cleanup: vi.fn(),
  };
}

function createSessionRepo() {
  return {
    findById: vi.fn(),
    findByIdentityId: vi.fn(),
    save: vi.fn(),
  };
}

function createCredentialRepo() {
  return {
    findById: vi.fn(),
    findByIdentifier: vi.fn(),
  };
}

function createService(
  tokenManager?: ReturnType<typeof createMockTokenManager>,
  rememberedAccountsService?: ReturnType<typeof createMockRememberedAccountsService>,
  networkStateManager?: ReturnType<typeof createMockNetworkStateManager>,
) {
  const windowManager = { getMainWindow: vi.fn(() => null) };
  return new AuthDesktopApplicationService(
    (tokenManager ?? createMockTokenManager()) as never,
    (rememberedAccountsService ?? createMockRememberedAccountsService()) as never,
    (networkStateManager ?? createMockNetworkStateManager()) as never,
    windowManager as never,
    createMockLogger() as never,
  );
}

describe('AuthDesktopApplicationService', () => {
  let mockTokenManager: ReturnType<typeof createMockTokenManager>;
  let mockSessionManager: ReturnType<typeof createMockSessionManager>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockTokenManager = createMockTokenManager();
    mockSessionManager = createMockSessionManager();
    mocks.sessionManagerInstance = mockSessionManager;
  });

  describe('assembly guards', () => {
    it('throws for coordinator-backed methods before repositories are injected', async () => {
      const service = createService(mockTokenManager);

      await expect(service.login({ email: 'a@b.com', password: 'x' })).rejects.toThrow(
        'Credential coordinator not initialized',
      );
      await expect(service.initialize()).rejects.toThrow(
        'Lifecycle coordinator not initialized',
      );
      await expect(service.enable2FA('totp')).rejects.toThrow(
        'Security admin service not initialized',
      );
    });

    it('wires the session refresh callback when repositories are injected', () => {
      const service = createService(mockTokenManager);

      service.setRepositories(createSessionRepo() as never, createCredentialRepo() as never);

      expect(mockSessionManager.setApiCallbacks).toHaveBeenCalledWith(
        expect.objectContaining({ refreshToken: expect.any(Function) }),
      );
    });

    it('keeps lifecycle methods callable after account repository injection', async () => {
      const service = createService(mockTokenManager);
      mockSessionManager.initialize.mockResolvedValue({ ok: false });

      service.setRepositories(createSessionRepo() as never, createCredentialRepo() as never);
      service.setAccountRepository({ findById: vi.fn() } as never);

      const result = await service.initialize();

      expect(result.ok).toBe(true);
      expect(service.getRuntimeState()).toBe('UNAUTHENTICATED');
    });
  });

  describe('identity and context helpers', () => {
    it('reads the current identity from the current session', () => {
      const service = createService(mockTokenManager);
      mockSessionManager.getCurrentSession.mockReturnValue({
        identityId: 'user-1',
        id: 'session-1',
        deviceInfo: { deviceId: 'dev-1' },
      });

      service.setRepositories(createSessionRepo() as never, createCredentialRepo() as never);

      expect(service.getCurrentIdentityId()).toBe('user-1');
      expect(service.getCurrentSessionId()).toBe('session-1');
      expect(service.getCurrentRequestContext()).toEqual({
        identityId: 'user-1',
        deviceId: 'dev-1',
      });
    });

    it('falls back to token cache when no session exists', async () => {
      const service = createService(mockTokenManager);
      mockTokenManager.getCachedTokenData.mockReturnValue({
        identityId: 'cached-user',
        sessionId: 'cached-session',
      });

      service.setRepositories(createSessionRepo() as never, createCredentialRepo() as never);

      expect(service.getCurrentIdentityId()).toBe('cached-user');
      expect(service.getCurrentSessionId()).toBe('cached-session');
      expect(service.getCurrentRequestContext()).toEqual({
        identityId: 'cached-user',
        deviceId: 'desktop-app',
      });

      const currentUser = await service.getCurrentUser();

      expect(currentUser.identity.id).toBe('cached-user');
      expect(currentUser.session).toBeNull();
    });
  });

  describe('facade-only fallback behavior', () => {
    it('clears tokens and returns ok when logout runs before assembly', async () => {
      const service = createService(mockTokenManager);

      const result = await service.logout();

      expect(result.ok).toBe(true);
      expect(mockTokenManager.clearTokens).toHaveBeenCalledOnce();
      expect(service.getRuntimeState()).toBe('UNAUTHENTICATED');
    });
  });
});
