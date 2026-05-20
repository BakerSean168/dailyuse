import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  loginDesktopAccount: vi.fn(),
  getTokenManager: vi.fn(),
  getRememberedAccountsService: vi.fn(),
  getNetworkStateManager: vi.fn(),
  getWindowManager: vi.fn(),
}));

vi.mock('../loginDesktopAccount', () => ({
  loginDesktopAccount: mocks.loginDesktopAccount,
}));

vi.mock('../../infrastructure', () => ({
  getTokenManager: mocks.getTokenManager,
  getRememberedAccountsService: mocks.getRememberedAccountsService,
  getNetworkStateManager: mocks.getNetworkStateManager,
  createSessionManager: vi.fn(),
  TokenManager: class {},
  SessionManager: class {},
}));

vi.mock('../../../../lifecycle/WindowManager', () => ({
  getWindowManager: mocks.getWindowManager,
}));

import { AuthDesktopApplicationService } from '../AuthDesktopApplicationService';

function createLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
}

describe('AuthDesktopApplicationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getTokenManager.mockReturnValue({
      loadTokens: vi.fn(),
      updateAccessToken: vi.fn(),
      updateRefreshToken: vi.fn(),
      getCachedTokenData: vi.fn(),
      getStatus: vi.fn().mockResolvedValue({
        isRefreshTokenExpired: false,
      }),
      getAccessToken: vi.fn(),
    });

    mocks.getRememberedAccountsService.mockReturnValue({
      recordLogin: vi.fn(),
      list: vi.fn().mockResolvedValue([]),
      getAutoLoginAccount: vi.fn().mockResolvedValue(null),
      remove: vi.fn(),
      decryptPassword: vi.fn(),
    });

    mocks.getNetworkStateManager.mockReturnValue({
      isOnline: vi.fn(() => true),
    });
    mocks.getWindowManager.mockReturnValue({
      getMainWindow: vi.fn(() => null),
    });
  });

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

    const service = new AuthDesktopApplicationService(createLogger() as never);
    (service as any).sessionManager = {
      loginOffline,
      getCurrentSession: vi.fn(() => null),
    };

    const result = await service.login({
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

    const service = new AuthDesktopApplicationService(createLogger() as never);
    (service as any).credentialRepository = {
      findByEmail: vi.fn().mockResolvedValue({
        id: 'user-1',
        toClientDTO: () => ({
          identifiers: [{ type: 'Email', value: 'active@example.com' }],
        }),
      }),
    };
    (service as any).sessionManager = {
      getCurrentSession: vi.fn(() => ({ identityId: 'user-1' })),
    };
    (service as any).runtimeState = 'AUTHENTICATED';
    mocks.getWindowManager.mockReturnValue({
      getMainWindow: vi.fn(() => ({ isDestroyed: () => false })),
    });

    const result = await service.login({
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

  it('returns remembered accounts without exposing plaintext passwords', async () => {
    mocks.getRememberedAccountsService.mockReturnValue({
      recordLogin: vi.fn(),
      list: vi.fn().mockResolvedValue([
        {
          identityId: 'user-1',
          identifier: 'saved@example.com',
          nickname: 'saved',
          avatarUrl: null,
          rememberPassword: true,
          autoLogin: false,
          lastUsedAt: 11,
          lastLoginAt: 10,
          encryptedPassword: 'ciphertext',
        },
      ]),
      getAutoLoginAccount: vi.fn().mockResolvedValue(null),
      remove: vi.fn(),
      decryptPassword: vi.fn().mockReturnValue('secret123'),
    });

    const service = new AuthDesktopApplicationService(createLogger() as never);
    const accounts = await service.getRememberedAccounts();

    expect(accounts).toEqual([
      expect.objectContaining({
        identityId: 'user-1',
        identifier: 'saved@example.com',
        hasSavedPassword: true,
      }),
    ]);
    expect('savedPassword' in accounts[0]!).toBe(false);
  });

  it('logs in remembered accounts through main-process password decryption only', async () => {
    mocks.loginDesktopAccount.mockResolvedValue({
      ok: false,
      error: {
        code: 'AUTH_FAILED',
        message: 'Bad credentials',
        shouldFallbackToOffline: false,
      },
    });

    mocks.getRememberedAccountsService.mockReturnValue({
      recordLogin: vi.fn(),
      list: vi.fn().mockResolvedValue([
        {
          identityId: 'user-1',
          identifier: 'saved@example.com',
          nickname: 'saved',
          avatarUrl: null,
          rememberPassword: true,
          autoLogin: false,
          lastUsedAt: 11,
          lastLoginAt: 10,
          encryptedPassword: 'ciphertext',
        },
      ]),
      getAutoLoginAccount: vi.fn().mockResolvedValue(null),
      remove: vi.fn(),
      decryptPassword: vi.fn().mockReturnValue('secret123'),
    });

    const service = new AuthDesktopApplicationService(createLogger() as never);
    (service as any).sessionManager = {
      getCurrentSession: vi.fn(() => null),
    };

    const result = await service.loginRememberedAccount({
      identityId: 'user-1',
      rememberPassword: true,
      autoLogin: false,
    });

    expect(mocks.loginDesktopAccount).toHaveBeenCalledOnce();
    expect(mocks.loginDesktopAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'saved@example.com',
        password: 'secret123',
        rememberPassword: true,
        autoLogin: false,
      }),
      expect.any(Object),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('AUTH_FAILED');
    }
  });
});
