import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthMode } from '@dailyuse/contracts/authentication';
import { AuthChannels } from '@dailyuse/contracts/electron';

const mocks = vi.hoisted(() => ({
  ipcHandle: vi.fn(),
  loginDesktopAccount: vi.fn(),
  registerDesktopAccount: vi.fn(),
}));

vi.mock('electron', () => ({
  ipcMain: {
    handle: mocks.ipcHandle,
  },
}));

vi.mock('./application/login-desktop-account', () => ({
  loginDesktopAccount: mocks.loginDesktopAccount,
}));

vi.mock('./application/register-desktop-account', () => ({
  registerDesktopAccount: mocks.registerDesktopAccount,
}));

vi.mock('./application/auth-remote-gateway', () => ({
  AuthRemoteGateway: class {},
}));

type RegisteredHandler = (event: unknown, payload?: unknown) => Promise<unknown>;

function getRegisteredHandler(channel: string): RegisteredHandler {
  const entry = mocks.ipcHandle.mock.calls.find(([registeredChannel]) => registeredChannel === channel);
  expect(entry, `Expected handler for ${channel} to be registered`).toBeTruthy();
  return entry![1] as RegisteredHandler;
}

describe('desktop-auth-shell', () => {
  let runtimeManager: {
    getCurrentAuthService: ReturnType<typeof vi.fn>;
    getPreparedAuthService: ReturnType<typeof vi.fn>;
    getActiveAuthService: ReturnType<typeof vi.fn>;
    prepareGuestProfile: ReturnType<typeof vi.fn>;
    prepareProfile: ReturnType<typeof vi.fn>;
    upgradeGuestProfileToOnlineIdentity: ReturnType<typeof vi.fn>;
    isGuestProfileIdentity: ReturnType<typeof vi.fn>;
    getActiveOrPreparedIdentityId: ReturnType<typeof vi.fn>;
    getActiveProfileDescriptor: ReturnType<typeof vi.fn>;
    activatePreparedProfile: ReturnType<typeof vi.fn>;
    discardPreparedProfile: ReturnType<typeof vi.fn>;
    deactivateProfile: ReturnType<typeof vi.fn>;
    getActiveProfileId: ReturnType<typeof vi.fn>;
    getActiveProfileResolver: ReturnType<typeof vi.fn>;
    findRegisteredProfileByIdentifier: ReturnType<typeof vi.fn>;
    removeProfile: ReturnType<typeof vi.fn>;
  };
  let windowManager: {
    transitionToMainWindow: ReturnType<typeof vi.fn>;
    transitionToLoginWindow: ReturnType<typeof vi.fn>;
  };
  let rememberedAccountsService: {
    getAutoLoginAccount: ReturnType<typeof vi.fn>;
    list: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let networkStateManager: {
    initialize: ReturnType<typeof vi.fn>;
    isOnline: ReturnType<typeof vi.fn>;
  };
  let authService: {
    logout: ReturnType<typeof vi.fn>;
    enterGuestMode: ReturnType<typeof vi.fn>;
    autoLogin: ReturnType<typeof vi.fn>;
    loginRememberedAccount: ReturnType<typeof vi.fn>;
    getStatus: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    authService = {
      logout: vi.fn().mockResolvedValue({ ok: true, data: undefined }),
      enterGuestMode: vi.fn().mockResolvedValue({ ok: true, data: { authMode: AuthMode.GUEST } }),
      autoLogin: vi.fn().mockResolvedValue({ ok: true, authenticated: true }),
      loginRememberedAccount: vi.fn().mockResolvedValue({ ok: true, data: { authMode: AuthMode.ONLINE_USER } }),
      getStatus: vi.fn().mockResolvedValue({ mode: AuthMode.ONLINE_USER }),
    };

    runtimeManager = {
      getCurrentAuthService: vi.fn(() => authService),
      getPreparedAuthService: vi.fn(() => authService),
      getActiveAuthService: vi.fn(() => authService),
      prepareGuestProfile: vi.fn().mockResolvedValue({}),
      prepareProfile: vi.fn().mockResolvedValue({ authService }),
      upgradeGuestProfileToOnlineIdentity: vi.fn().mockResolvedValue({ authService }),
      isGuestProfileIdentity: vi.fn(() => false),
      getActiveOrPreparedIdentityId: vi.fn(() => null),
      getActiveProfileDescriptor: vi.fn().mockResolvedValue(null),
      activatePreparedProfile: vi.fn().mockResolvedValue(undefined),
      discardPreparedProfile: vi.fn().mockResolvedValue(undefined),
      deactivateProfile: vi.fn().mockResolvedValue(undefined),
      getActiveProfileId: vi.fn(() => 'profile-1'),
      getActiveProfileResolver: vi.fn(() => ({ mainWindowStatePath: 'D:\\profiles\\profile-1\\ui\\main-window-state.json' })),
      findRegisteredProfileByIdentifier: vi.fn().mockResolvedValue(null),
      removeProfile: vi.fn().mockResolvedValue(undefined),
    };

    windowManager = {
      transitionToMainWindow: vi.fn().mockResolvedValue(undefined),
      transitionToLoginWindow: vi.fn().mockResolvedValue(undefined),
    };

    rememberedAccountsService = {
      getAutoLoginAccount: vi.fn().mockResolvedValue(null),
      list: vi.fn().mockResolvedValue([]),
      remove: vi.fn().mockResolvedValue(undefined),
    };

    networkStateManager = {
      initialize: vi.fn().mockResolvedValue(undefined),
      isOnline: vi.fn(() => true),
    };

    mocks.loginDesktopAccount.mockResolvedValue({
      ok: false,
      error: { code: 'NOT_USED', message: 'not used in this test' },
    });
    mocks.registerDesktopAccount.mockResolvedValue({
      ok: false,
      error: { code: 'NOT_USED', message: 'not used in this test' },
    });
  });

  it('auth:logout logs out, deactivates the profile, and transitions back to login', async () => {
    const { registerDesktopAuthShellHandlers } = await import('./desktop-auth-shell');
    registerDesktopAuthShellHandlers(runtimeManager, { rememberedAccountsService, networkStateManager, windowManager });

    const handler = getRegisteredHandler(AuthChannels.LOGOUT);
    const result = await handler({});

    expect(authService.logout).toHaveBeenCalledOnce();
    expect(runtimeManager.deactivateProfile).toHaveBeenCalledOnce();
    expect(windowManager.transitionToLoginWindow).toHaveBeenCalledOnce();
    expect(authService.logout.mock.invocationCallOrder[0]).toBeLessThan(
      runtimeManager.deactivateProfile.mock.invocationCallOrder[0]!,
    );
    expect(runtimeManager.deactivateProfile.mock.invocationCallOrder[0]).toBeLessThan(
      windowManager.transitionToLoginWindow.mock.invocationCallOrder[0]!,
    );
    expect(result).toEqual({ ok: true, data: undefined });
  });

  it('auth:enter-guest-mode prepares a guest profile and activates local mode', async () => {
    authService.getStatus.mockResolvedValue({ mode: AuthMode.GUEST });

    const { registerDesktopAuthShellHandlers } = await import('./desktop-auth-shell');
    registerDesktopAuthShellHandlers(runtimeManager, { rememberedAccountsService, networkStateManager, windowManager });

    const handler = getRegisteredHandler(AuthChannels.ENTER_GUEST_MODE);
    const result = await handler({});

    expect(runtimeManager.prepareGuestProfile).toHaveBeenCalledOnce();
    expect(authService.enterGuestMode).toHaveBeenCalledOnce();
    expect(runtimeManager.activatePreparedProfile).toHaveBeenCalledWith({ syncMode: 'local' });
    expect(windowManager.transitionToMainWindow).toHaveBeenCalledWith(
      'profile-1',
      'D:\\profiles\\profile-1\\ui\\main-window-state.json',
    );
    expect(runtimeManager.discardPreparedProfile).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true, data: { authMode: AuthMode.GUEST } });
  });

  it('auth:auto-login prepares the remembered profile and activates online mode after success', async () => {
    rememberedAccountsService.getAutoLoginAccount.mockResolvedValue({
      identityId: 'identity-a',
      nickname: 'Alice',
      identifier: 'alice@example.com',
    });
    authService.autoLogin.mockResolvedValue({ ok: true, authenticated: true });
    authService.getStatus.mockResolvedValue({ mode: AuthMode.ONLINE_USER });

    const { registerDesktopAuthShellHandlers } = await import('./desktop-auth-shell');
    registerDesktopAuthShellHandlers(runtimeManager, { rememberedAccountsService, networkStateManager, windowManager });

    const handler = getRegisteredHandler(AuthChannels.AUTO_LOGIN);
    const result = await handler({});

    expect(runtimeManager.prepareProfile).toHaveBeenCalledWith('identity-a', {
      displayName: 'Alice',
      identifier: 'alice@example.com',
    });
    expect(authService.autoLogin).toHaveBeenCalledOnce();
    expect(runtimeManager.activatePreparedProfile).toHaveBeenCalledWith({ syncMode: 'online' });
    expect(windowManager.transitionToMainWindow).toHaveBeenCalledOnce();
    expect(result).toEqual({ ok: true, data: { ok: true, authenticated: true } });
  });

  it('auth:remembered-accounts:login activates local mode for offline remembered logins', async () => {
    authService.loginRememberedAccount.mockResolvedValue({
      ok: true,
      data: { authMode: AuthMode.OFFLINE_USER },
    });
    authService.getStatus.mockResolvedValue({ mode: AuthMode.OFFLINE_USER });

    const { registerDesktopAuthShellHandlers } = await import('./desktop-auth-shell');
    registerDesktopAuthShellHandlers(runtimeManager, { rememberedAccountsService, networkStateManager, windowManager });

    const handler = getRegisteredHandler(AuthChannels.REMEMBERED_ACCOUNTS_LOGIN);
    const request = { identityId: 'identity-a', identifier: 'alice@example.com' };
    const result = await handler({}, request);

    expect(runtimeManager.prepareProfile).toHaveBeenCalledWith('identity-a', {
      displayName: 'alice@example.com',
      identifier: 'alice@example.com',
    });
    expect(authService.loginRememberedAccount).toHaveBeenCalledWith(request);
    expect(runtimeManager.activatePreparedProfile).toHaveBeenCalledWith({ syncMode: 'local' });
    expect(windowManager.transitionToMainWindow).toHaveBeenCalledOnce();
    expect(result).toEqual({
      ok: true,
      data: { authMode: AuthMode.OFFLINE_USER },
    });
  });

  it('auth:remembered-accounts:login discards the prepared profile on failure and does not activate', async () => {
    authService.loginRememberedAccount.mockResolvedValue({
      ok: false,
      error: { code: 'AUTH_FAILED', message: 'Bad credentials' },
    });

    const { registerDesktopAuthShellHandlers } = await import('./desktop-auth-shell');
    registerDesktopAuthShellHandlers(runtimeManager, { rememberedAccountsService, networkStateManager, windowManager });

    const handler = getRegisteredHandler(AuthChannels.REMEMBERED_ACCOUNTS_LOGIN);
    const request = { identityId: 'identity-a', identifier: 'alice@example.com' };
    const result = await handler({}, request);

    expect(runtimeManager.prepareProfile).toHaveBeenCalledWith('identity-a', {
      displayName: 'alice@example.com',
      identifier: 'alice@example.com',
    });
    expect(authService.loginRememberedAccount).toHaveBeenCalledWith(request);
    expect(runtimeManager.discardPreparedProfile).toHaveBeenCalledOnce();
    expect(runtimeManager.activatePreparedProfile).not.toHaveBeenCalled();
    expect(windowManager.transitionToMainWindow).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      error: { code: 'AUTH_FAILED', message: 'Bad credentials' },
    });
  });

  it('auth:login upgrades guest profile ownership instead of creating a new profile dir', async () => {
    runtimeManager.isGuestProfileIdentity.mockImplementation((id: string | null | undefined) => id === '__desktop_guest_profile__');
    runtimeManager.getActiveOrPreparedIdentityId.mockReturnValue('__desktop_guest_profile__');
    runtimeManager.getActiveProfileDescriptor.mockResolvedValue({
      identityId: '__desktop_guest_profile__',
      profileId: 'p_guest',
    });
    (authService as any).completeRemoteLoginSuccess = vi.fn().mockResolvedValue(undefined);

    mocks.loginDesktopAccount.mockResolvedValue({
      ok: true,
      response: {
        accessToken: 'access',
        refreshToken: 'refresh',
        identity: { id: 'identity-online', email: 'online@example.com' },
        session: { id: 'session-1' },
      },
    });

    const { registerDesktopAuthShellHandlers } = await import('./desktop-auth-shell');
    registerDesktopAuthShellHandlers(runtimeManager as never, {
      rememberedAccountsService: rememberedAccountsService as never,
      networkStateManager: networkStateManager as never,
      windowManager: windowManager as never,
    });

    const handler = getRegisteredHandler(AuthChannels.LOGIN);
    const result = await handler({}, {
      email: 'online@example.com',
      password: 'secret',
      rememberPassword: false,
      autoLogin: false,
    });

    expect(result).toMatchObject({ ok: true });
    expect(runtimeManager.upgradeGuestProfileToOnlineIdentity).toHaveBeenCalledWith({
      onlineIdentityId: 'identity-online',
      displayName: 'online@example.com',
      identifier: 'online@example.com',
      snapshotAccessToken: 'access',
    });
    expect(runtimeManager.prepareProfile).not.toHaveBeenCalled();
    expect(authService.completeRemoteLoginSuccess).toHaveBeenCalled();
  });

});
