import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  loginDesktopAccount: vi.fn(),
  getTokenManager: vi.fn(),
  getRememberedAccountsService: vi.fn(),
  getNetworkStateManager: vi.fn(),
  ensurePowerSyncSyncMode: vi.fn(),
  openPowerSyncLocalOnly: vi.fn(),
  disconnectPowerSync: vi.fn(),
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

vi.mock('../../../../database/powersync', () => ({
  ensurePowerSyncSyncMode: mocks.ensurePowerSyncSyncMode,
  openPowerSyncLocalOnly: mocks.openPowerSyncLocalOnly,
  disconnectPowerSync: mocks.disconnectPowerSync,
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
      remove: vi.fn(),
      decryptPassword: vi.fn(),
    });

    mocks.getNetworkStateManager.mockReturnValue({
      isOnline: vi.fn(() => true),
    });

    mocks.ensurePowerSyncSyncMode.mockResolvedValue(undefined);
    mocks.openPowerSyncLocalOnly.mockResolvedValue(undefined);
    mocks.disconnectPowerSync.mockResolvedValue(undefined);
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

  it('ensures sync mode directly for online PowerSync initialization', async () => {
    const service = new AuthDesktopApplicationService(createLogger() as never);

    (service as any).initializePowerSyncAsync('ONLINE_USER');
    await (service as any).powerSyncInitPromise;

    expect(mocks.ensurePowerSyncSyncMode).toHaveBeenCalledOnce();
    expect(mocks.openPowerSyncLocalOnly).not.toHaveBeenCalled();
  });
});
