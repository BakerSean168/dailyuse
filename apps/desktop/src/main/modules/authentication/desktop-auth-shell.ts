import { ipcMain } from 'electron';
import { IdentityId } from '@dailyuse/domain-shared';
import { AuthMode, AuthRuntimeState } from '@dailyuse/contracts/authentication';
import { ok, fail, toIpcResult, type IpcResult } from '@dailyuse/contracts/result';
import { createLogger } from '@dailyuse/utils/logger';
import type { WindowManager } from '../../lifecycle/window-manager';
import type { DesktopProfileRuntimeManager } from '../../profile';
import type { RememberedAccountsService, NetworkStateManager } from './infrastructure';
import type { AuthDesktopApplicationService } from './application/auth-desktop-application-service';
import { loginDesktopAccount } from './application/login-desktop-account';
import {
  registerDesktopAccount,
  type RegisterRequest,
} from './application/register-desktop-account';
import { AuthRemoteGateway } from './application/auth-remote-gateway';

const logger = createLogger('DesktopAuthShell');
const remoteGateway = new AuthRemoteGateway();

const Ch = {
  LOGIN: 'auth:login',
  REGISTER: 'auth:register',
  LOGOUT: 'auth:logout',
  REFRESH_TOKEN: 'auth:refresh-token',
  ENTER_GUEST_MODE: 'auth:enter-guest-mode',
  GET_CURRENT_USER: 'auth:get-current-user',
  GET_STATUS: 'auth:get-status',
  GET_BOOTSTRAP_SNAPSHOT: 'auth:get-bootstrap-snapshot',
  INITIALIZE: 'auth:initialize',
  AUTO_LOGIN: 'auth:auto-login',
  REMEMBERED_ACCOUNTS_LIST: 'auth:remembered-accounts:list',
  REMEMBERED_ACCOUNTS_LOGIN: 'auth:remembered-accounts:login',
  REMEMBERED_ACCOUNTS_REMOVE: 'auth:remembered-accounts:remove',
  VERIFY_TOKEN: 'auth:verify-token',
  TOKEN_STATUS: 'auth:token-status',
  SESSION_STATUS: 'auth:session-status',
  CLEANUP_SESSIONS: 'auth:cleanup-sessions',
  TFA_ENABLE: 'auth:2fa:enable',
  TFA_DISABLE: 'auth:2fa:disable',
  TFA_VERIFY: 'auth:2fa:verify',
  TFA_GET_STATUS: 'auth:2fa:get-status',
  TFA_BACKUP_CODES: 'auth:2fa:generate-backup-codes',
  API_KEY_CREATE: 'auth:api-key:create',
  API_KEY_LIST: 'auth:api-key:list',
  API_KEY_REVOKE: 'auth:api-key:revoke',
  API_KEY_ROTATE: 'auth:api-key:rotate',
  SESSION_LIST: 'auth:session:list',
  SESSION_GET_CURRENT: 'auth:session:get-current',
  SESSION_REVOKE: 'auth:session:revoke',
  SESSION_REVOKE_ALL: 'auth:session:revoke-all',
  DEVICE_LIST: 'auth:device:list',
  DEVICE_GET_CURRENT: 'auth:device:get-current',
  DEVICE_TRUST: 'auth:device:trust',
  DEVICE_REVOKE: 'auth:device:revoke',
  DEVICE_RENAME: 'auth:device:rename',
  FORGOT_PASSWORD: 'auth:forgot-password',
  RESET_PASSWORD: 'auth:reset-password',
  CHANGE_PASSWORD: 'auth:change-password',
  SEND_EMAIL_CODE: 'auth:send-email-code',
  VERIFY_EMAIL_CODE: 'auth:verify-email-code',
  GET_OAUTH_URL: 'auth:get-oauth-url',
  OAUTH_PROVIDERS: 'auth:oauth-providers',
  OAUTH_CALLBACK: 'auth:oauth-callback',
  OAUTH_BIND: 'auth:oauth-bind',
  OAUTH_UNBIND: 'auth:oauth-unbind',
} as const;

const allChannels = Object.values(Ch);

function unauthenticatedStatus() {
  return {
    authenticated: false,
    mode: AuthMode.UNAUTHENTICATED,
    runtimeState: AuthRuntimeState.UNAUTHENTICATED,
    connectionStatus: 'OFFLINE',
    user: null,
    session: null,
    tokenStatus: {
      hasValidToken: false,
      isAccessTokenExpired: true,
      isRefreshTokenExpired: true,
      shouldRefresh: false,
      accessTokenRemainingMs: 0,
      refreshTokenRemainingMs: 0,
    },
    canSync: false,
    needsReauth: false,
  };
}

async function withPreparedProfile<T>(
  runtimeManager: DesktopProfileRuntimeManager,
  identityId: string,
  options: { displayName?: string; identifier?: string | null; snapshotAccessToken?: string | null },
  callback: (service: AuthDesktopApplicationService) => Promise<T>,
): Promise<T> {
  const prepared = await runtimeManager.prepareProfile(identityId, options);

  try {
    return await callback(prepared.authService);
  } catch (error) {
    await runtimeManager.discardPreparedProfile().catch((discardError) =>
      logger.error('Failed to discard prepared profile after auth error', {
        error: discardError,
      }),
    );
    throw error;
  }
}

async function activatePreparedProfileForCurrentMode(
  runtimeManager: DesktopProfileRuntimeManager,
  windowManager: WindowManager,
): Promise<void> {
  const service = runtimeManager.getCurrentAuthService();
  if (!service) {
    throw new Error('No prepared auth service is available for activation');
  }

  const status = await service.getStatus();
  const syncMode = status.mode === AuthMode.ONLINE_USER ? 'online' : 'local';
  await runtimeManager.activatePreparedProfile({ syncMode });

  const profileId = runtimeManager.getActiveProfileId();
  const profileResolver = runtimeManager.getActiveProfileResolver();
  if (!profileId || !profileResolver) {
    throw new Error('No active profile available for main window transition');
  }
  await windowManager.transitionToMainWindow(profileId, profileResolver.mainWindowStatePath);
}


async function prepareProfileForOnlineIdentity(
  runtimeManager: DesktopProfileRuntimeManager,
  onlineIdentityId: string,
  options: {
    displayName?: string;
    identifier?: string | null;
    snapshotAccessToken?: string | null;
  },
  callback: (service: AuthDesktopApplicationService) => Promise<void>,
): Promise<void> {
  const currentIdentity = runtimeManager.getActiveOrPreparedIdentityId();
  const guestActive =
    runtimeManager.isGuestProfileIdentity(currentIdentity) ||
    (await runtimeManager.getActiveProfileDescriptor().then((d) =>
      runtimeManager.isGuestProfileIdentity(d?.identityId),
    ));

  if (guestActive) {
    // Guest upgrade path: rebind ownership, keep Vault directory, then run success hook.
    // 访客升级：重绑 ownership、保留 Vault 目录，再跑成功钩子。
    const prepared = await runtimeManager.upgradeGuestProfileToOnlineIdentity({
      onlineIdentityId,
      displayName: options.displayName,
      identifier: options.identifier,
      snapshotAccessToken: options.snapshotAccessToken,
    });
    await callback(prepared.authService);
    return;
  }

  await withPreparedProfile(runtimeManager, onlineIdentityId, options, callback);
}

function mapRememberedAccounts(
  records: Awaited<ReturnType<RememberedAccountsService['list']>>,
) {
  return records.map((account) => ({
    identityId: account.identityId,
    identifier: account.identifier,
    nickname: account.nickname,
    avatarUrl: account.avatarUrl,
    rememberPassword: account.rememberPassword,
    autoLogin: account.autoLogin,
    lastUsedAt: account.lastUsedAt,
    lastLoginAt: account.lastLoginAt,
    hasSavedPassword: account.rememberPassword && Boolean(account.encryptedPassword),
  }));
}

export function registerDesktopAuthShellHandlers(
  runtimeManager: DesktopProfileRuntimeManager,
  deps: {
    rememberedAccountsService: RememberedAccountsService;
    networkStateManager: NetworkStateManager;
    windowManager: WindowManager;
  },
): void {
  const { rememberedAccountsService, networkStateManager, windowManager } = deps;
  networkStateManager.initialize().catch((error) =>
    logger.error('NetworkStateManager init failed', { error }),
  );

  const currentAuthService = () => runtimeManager.getCurrentAuthService();

  ipcMain.handle(Ch.LOGIN, async (_event, data) => {
    const existingProfile = await runtimeManager.findRegisteredProfileByIdentifier(String(data.email));

    try {
      if (existingProfile) {
        const result = await withPreparedProfile(
          runtimeManager,
          existingProfile.identityId,
          {
            displayName: existingProfile.displayName,
            identifier: data.email,
          },
          async (service) => await service.login(data),
        );

        if (!result.ok || !result.data) {
          await runtimeManager.discardPreparedProfile();
          return result;
        }

        await activatePreparedProfileForCurrentMode(runtimeManager, windowManager);
        return result;
      }

      const remoteResult = await loginDesktopAccount(data, {
        isOnline: () => networkStateManager.isOnline(),
        remoteGateway,
        logger,
      });

      if (!remoteResult.ok) {
        return toIpcResult(
          fail({
            code: remoteResult.error.code,
            message: remoteResult.error.message,
          }),
        );
      }

      await prepareProfileForOnlineIdentity(
        runtimeManager,
        String(remoteResult.response.identity.id),
        {
          displayName: data.email,
          identifier: data.email,
          snapshotAccessToken: remoteResult.response.accessToken,
        },
        async (service) => {
          await service.completeRemoteLoginSuccess(remoteResult.response, {
            email: data.email,
            password: data.password,
            rememberPassword: data.rememberPassword,
            autoLogin: data.autoLogin,
          });
        },
      );

      await activatePreparedProfileForCurrentMode(runtimeManager, windowManager);
      return toIpcResult(ok(remoteResult.response));
    } catch (error) {
      await runtimeManager.discardPreparedProfile().catch(() => undefined);
      logger.error('Shell login failed', { error });
      return toIpcResult(
        fail({
          code: 'LOGIN_ERROR',
          message: error instanceof Error ? error.message : '登录失败',
        }),
      );
    }
  });

  ipcMain.handle(Ch.REGISTER, async (_event, request: RegisterRequest) => {
    try {
      const result = await registerDesktopAccount(request, {
        isOnline: () => networkStateManager.isOnline(),
        remoteGateway,
        logger,
      });

      if (!result.ok) {
        return toIpcResult(fail(result.error));
      }

      await prepareProfileForOnlineIdentity(
        runtimeManager,
        String(result.response.identity.id),
        {
          displayName: request.username ?? request.email,
          identifier: request.email,
          snapshotAccessToken: result.response.accessToken,
        },
        async (service) => {
          await service.completeRegisterSuccess(
            {
              accessToken: result.response.accessToken,
              refreshToken: result.response.refreshToken,
              identity: result.response.identity,
              session: result.response.session,
            },
            request,
          );
        },
      );

      await activatePreparedProfileForCurrentMode(runtimeManager, windowManager);
      return toIpcResult(ok(result.response));
    } catch (error) {
      await runtimeManager.discardPreparedProfile().catch(() => undefined);
      logger.error('Shell register failed', { error });
      return toIpcResult(
        fail({
          code: 'REGISTER_ERROR',
          message: error instanceof Error ? error.message : '注册失败',
        }),
      );
    }
  });

  ipcMain.handle(Ch.LOGOUT, async () => {
    const service = runtimeManager.getActiveAuthService();
    const result: IpcResult<void> = service ? await service.logout() : toIpcResult(ok(undefined));

    await runtimeManager.deactivateProfile();
    await windowManager.transitionToLoginWindow();

    return result;
  });

  ipcMain.handle(Ch.REFRESH_TOKEN, async () => {
    const service = currentAuthService();
    if (!service) {
      return toIpcResult(fail({ code: 'AUTH_REQUIRED', message: '当前没有活跃账号' }));
    }
    return await service.refreshToken();
  });

  ipcMain.handle(Ch.ENTER_GUEST_MODE, async () => {
    try {
      await runtimeManager.prepareGuestProfile();
      const service = runtimeManager.getPreparedAuthService();
      if (!service) {
        throw new Error('Guest auth service was not prepared');
      }

      const result = await service.enterGuestMode();
      if (!result.ok) {
        await runtimeManager.discardPreparedProfile();
        return result;
      }

      await runtimeManager.activatePreparedProfile({ syncMode: 'local' });
      const profileId = runtimeManager.getActiveProfileId();
      const profileResolver = runtimeManager.getActiveProfileResolver();
      if (!profileId || !profileResolver) {
        throw new Error('No active profile available for main window transition');
      }
      await windowManager.transitionToMainWindow(profileId, profileResolver.mainWindowStatePath);
      return result;
    } catch (error) {
      await runtimeManager.discardPreparedProfile().catch(() => undefined);
      logger.error('Guest mode activation failed', { error });
      return toIpcResult(
        fail({
          code: 'GUEST_MODE_ERROR',
          message: error instanceof Error ? error.message : '进入访客模式失败',
        }),
      );
    }
  });

  ipcMain.handle(Ch.GET_STATUS, async () => {
    const service = currentAuthService();
    return service ? await service.getStatus() : unauthenticatedStatus();
  });

  ipcMain.handle(Ch.GET_BOOTSTRAP_SNAPSHOT, async () => {
    const service = currentAuthService();
    return service
      ? await service.buildBootstrapSnapshot()
      : {
          status: unauthenticatedStatus(),
          currentUser: null,
        };
  });

  ipcMain.handle(Ch.INITIALIZE, async () => {
    const service = currentAuthService();
    if (!service) {
      return {
        ok: true,
        hasValidSession: false,
        runtimeState: AuthRuntimeState.UNAUTHENTICATED,
      };
    }
    return await service.initialize();
  });

  ipcMain.handle(Ch.AUTO_LOGIN, async () => {
    const remembered = await rememberedAccountsService.getAutoLoginAccount();
    if (!remembered) {
      return { ok: true, authenticated: false };
    }

    try {
      await runtimeManager.prepareProfile(String(remembered.identityId), {
        displayName: remembered.nickname ?? remembered.identifier,
        identifier: remembered.identifier,
      });

      const service = runtimeManager.getPreparedAuthService();
      if (!service) {
        throw new Error('Prepared auth service is not available for auto login');
      }

      const result = await service.autoLogin();
      if (!result.ok || !result.authenticated) {
        await runtimeManager.discardPreparedProfile();
        return result;
      }

      await activatePreparedProfileForCurrentMode(runtimeManager, windowManager);
      return result;
    } catch (error) {
      await runtimeManager.discardPreparedProfile().catch(() => undefined);
      logger.error('Auto login failed in shell auth', { error });
      return { ok: false, authenticated: false, error: String(error) };
    }
  });

  ipcMain.handle(Ch.REMEMBERED_ACCOUNTS_LIST, async () => {
    const accounts = await rememberedAccountsService.list();
    return mapRememberedAccounts(accounts);
  });

  ipcMain.handle(Ch.REMEMBERED_ACCOUNTS_LOGIN, async (_event, request) => {
    try {
      await runtimeManager.prepareProfile(String(request.identityId), {
        displayName: request.identifier,
        identifier: request.identifier,
      });

      const service = runtimeManager.getPreparedAuthService();
      if (!service) {
        throw new Error('Prepared auth service is not available for remembered login');
      }

      const result = await service.loginRememberedAccount(request);
      if (!result.ok || !result.data) {
        await runtimeManager.discardPreparedProfile();
        return result;
      }

      await activatePreparedProfileForCurrentMode(runtimeManager, windowManager);
      return result;
    } catch (error) {
      await runtimeManager.discardPreparedProfile().catch(() => undefined);
      logger.error('Remembered account login failed', { error });
      return toIpcResult(
        fail({
          code: 'LOGIN_ERROR',
          message: error instanceof Error ? error.message : '登录失败',
        }),
      );
    }
  });

  ipcMain.handle(Ch.REMEMBERED_ACCOUNTS_REMOVE, async (_event, identityId: string) => {
    try {
      await rememberedAccountsService.remove(IdentityId.of(identityId));
      await runtimeManager.removeProfile(identityId);
      return toIpcResult(ok(undefined));
    } catch (error) {
      logger.error('Failed to remove remembered account/profile', { error, identityId });
      return toIpcResult(
        fail({
          code: 'REMEMBERED_ACCOUNT_REMOVE_FAILED',
          message: String(error),
        }),
      );
    }
  });

  ipcMain.handle(Ch.GET_CURRENT_USER, async () => {
    const service = currentAuthService();
    return service ? await service.getCurrentUser() : null;
  });

  ipcMain.handle(Ch.VERIFY_TOKEN, async (_event, token: string) => {
    const service = currentAuthService();
    return service ? await service.verifyToken(token) : { valid: false, error: 'AUTH_REQUIRED' };
  });

  ipcMain.handle(Ch.TOKEN_STATUS, async () => {
    const service = currentAuthService();
    return service
      ? await service.getTokenStatus()
      : unauthenticatedStatus().tokenStatus;
  });

  ipcMain.handle(Ch.SESSION_STATUS, async () => {
    const service = currentAuthService();
    return service ? await service.getSessionStatus() : null;
  });

  ipcMain.handle(Ch.CLEANUP_SESSIONS, async () => {
    const service = currentAuthService();
    return service ? await service.cleanupExpiredSessions() : 0;
  });

  ipcMain.handle(Ch.TFA_ENABLE, async (_event, method: string) => {
    const service = currentAuthService();
    return service
      ? await service.enable2FA(method || 'totp')
      : toIpcResult(fail({ code: 'AUTH_REQUIRED', message: '当前没有活跃账号' }));
  });
  ipcMain.handle(Ch.TFA_DISABLE, async () => {
    const service = currentAuthService();
    return service
      ? await service.disable2FA()
      : toIpcResult(fail({ code: 'AUTH_REQUIRED', message: '当前没有活跃账号' }));
  });
  ipcMain.handle(Ch.TFA_VERIFY, async (_event, code: string) => {
    const service = currentAuthService();
    return service
      ? await service.verify2FA(code)
      : toIpcResult(fail({ code: 'AUTH_REQUIRED', message: '当前没有活跃账号' }));
  });
  ipcMain.handle(Ch.TFA_GET_STATUS, async () => {
    const service = currentAuthService();
    return service ? await service.get2FAStatus() : { enabled: false, method: null };
  });
  ipcMain.handle(Ch.TFA_BACKUP_CODES, async () => {
    const service = currentAuthService();
    return service ? await service.generateBackupCodes() : { codes: [] };
  });

  ipcMain.handle(Ch.API_KEY_CREATE, async (_event, req) => {
    const service = currentAuthService();
    return service ? await service.createApiKey(req) : null;
  });
  ipcMain.handle(Ch.API_KEY_LIST, async () => {
    const service = currentAuthService();
    return service ? await service.listApiKeys() : { apiKeys: [], total: 0 };
  });
  ipcMain.handle(Ch.API_KEY_REVOKE, async (_event, keyId: string) => {
    const service = currentAuthService();
    return service
      ? await service.revokeApiKey(keyId)
      : toIpcResult(fail({ code: 'AUTH_REQUIRED', message: '当前没有活跃账号' }));
  });
  ipcMain.handle(Ch.API_KEY_ROTATE, async (_event, keyId: string) => {
    const service = currentAuthService();
    return service ? await service.rotateApiKey(keyId) : { newKey: null };
  });

  ipcMain.handle(Ch.SESSION_LIST, async () => {
    const service = currentAuthService();
    return service ? await service.listSessions() : { sessions: [] };
  });
  ipcMain.handle(Ch.SESSION_GET_CURRENT, async () => {
    const service = currentAuthService();
    return service ? await service.getCurrentSession() : null;
  });
  ipcMain.handle(Ch.SESSION_REVOKE, async (_event, payload: string | { sessionId: string }) => {
    const service = currentAuthService();
    return service
      ? await service.revokeSession(typeof payload === 'string' ? payload : payload?.sessionId)
      : toIpcResult(fail({ code: 'AUTH_REQUIRED', message: '当前没有活跃账号' }));
  });
  ipcMain.handle(Ch.SESSION_REVOKE_ALL, async () => {
    const service = currentAuthService();
    return service ? await service.revokeAllSessions() : { ok: false, count: 0 };
  });

  ipcMain.handle(Ch.DEVICE_LIST, async () => {
    const service = currentAuthService();
    return service ? await service.listDevices() : { devices: [], total: 0 };
  });
  ipcMain.handle(Ch.DEVICE_GET_CURRENT, async () => {
    const service = currentAuthService();
    return service
      ? await service.getCurrentDevice()
      : {
          id: 'unknown',
          name: 'Desktop App',
          type: 'DESKTOP',
        };
  });
  ipcMain.handle(Ch.DEVICE_TRUST, async () =>
    toIpcResult(fail({ code: 'NOT_IMPLEMENTED', message: 'Device trust not implemented' })),
  );
  ipcMain.handle(Ch.DEVICE_REVOKE, async (_event, deviceId: string) => {
    const service = currentAuthService();
    return service
      ? await service.revokeDevice(deviceId)
      : toIpcResult(fail({ code: 'AUTH_REQUIRED', message: '当前没有活跃账号' }));
  });
  ipcMain.handle(Ch.DEVICE_RENAME, async (_event, data: { deviceId: string; name: string }) => {
    const service = currentAuthService();
    return service
      ? await service.renameDevice(data.deviceId, data.name)
      : toIpcResult(fail({ code: 'AUTH_REQUIRED', message: '当前没有活跃账号' }));
  });

  ipcMain.handle(Ch.FORGOT_PASSWORD, async (_event, data) =>
    toIpcResult(await remoteGateway.forgotPassword(data)),
  );
  ipcMain.handle(Ch.RESET_PASSWORD, async (_event, data) =>
    toIpcResult(await remoteGateway.resetPassword(data)),
  );
  ipcMain.handle(Ch.CHANGE_PASSWORD, async (_event, data) => {
    const service = currentAuthService();
    const accessToken = service?.getAccessToken?.() ?? null;
    if (!accessToken) {
      return toIpcResult(fail({ code: 'AUTH_REQUIRED', message: '当前没有活跃账号' }));
    }
    return toIpcResult(await remoteGateway.changePassword(data, accessToken));
  });
  ipcMain.handle(Ch.SEND_EMAIL_CODE, async (_event, data) => {
    const service = currentAuthService();
    const accessToken = service?.getAccessToken?.() ?? undefined;
    return toIpcResult(await remoteGateway.sendEmailCode(data, accessToken));
  });
  ipcMain.handle(Ch.VERIFY_EMAIL_CODE, async (_event, data) => {
    const service = currentAuthService();
    const accessToken = service?.getAccessToken?.() ?? undefined;
    return toIpcResult(await remoteGateway.verifyEmailCode(data, accessToken));
  });
  ipcMain.handle(Ch.GET_OAUTH_URL, async (_event, data) =>
    toIpcResult(await remoteGateway.getOAuthUrl(data)),
  );
  ipcMain.handle(Ch.OAUTH_PROVIDERS, async () =>
    toIpcResult(await remoteGateway.listOAuthProviders()),
  );
  ipcMain.handle(Ch.OAUTH_CALLBACK, async (_event, data) => {
    try {
      const remoteResult = await remoteGateway.oauthCallback(data);
      if (!remoteResult.ok) {
        return toIpcResult(remoteResult);
      }

      const identity = remoteResult.data.identity;
      const emailIdentifier = identity.identifiers?.find((item) => item.type === 'Email');
      const email = emailIdentifier && 'value' in emailIdentifier ? emailIdentifier.value : null;
      const displayName = email ?? String(identity.id);

      await prepareProfileForOnlineIdentity(
        runtimeManager,
        String(identity.id),
        {
          displayName,
          identifier: email,
          snapshotAccessToken: remoteResult.data.accessToken,
        },
        async (service) => {
          // Reuse remote-login success path without password remember flags.
          // 复用远程登录成功路径（无记住密码标志）。
          await service.completeRemoteLoginSuccess(remoteResult.data, {
            email: email ?? displayName,
            password: '',
            rememberPassword: false,
            autoLogin: false,
          });
        },
      );

      await activatePreparedProfileForCurrentMode(runtimeManager, windowManager);
      return toIpcResult(remoteResult);
    } catch (error) {
      await runtimeManager.discardPreparedProfile().catch(() => undefined);
      logger.error('Shell OAuth callback failed', { error });
      return toIpcResult(
        fail({
          code: 'OAUTH_ERROR',
          message: error instanceof Error ? error.message : 'OAuth 登录失败',
        }),
      );
    }
  });
  ipcMain.handle(Ch.OAUTH_BIND, async (_event, data) => {
    const service = currentAuthService();
    const accessToken = service?.getAccessToken?.() ?? null;
    if (!accessToken) {
      return toIpcResult(fail({ code: 'AUTH_REQUIRED', message: '当前没有活跃账号' }));
    }
    return toIpcResult(await remoteGateway.bindOAuth(data, accessToken));
  });
  ipcMain.handle(Ch.OAUTH_UNBIND, async (_event, data) => {
    const service = currentAuthService();
    const accessToken = service?.getAccessToken?.() ?? null;
    if (!accessToken) {
      return toIpcResult(fail({ code: 'AUTH_REQUIRED', message: '当前没有活跃账号' }));
    }
    return toIpcResult(await remoteGateway.unbindOAuth(data, accessToken));
  });

  logger.info(`Desktop shell auth handlers registered (${allChannels.length} channels)`);
}
