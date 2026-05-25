import { ipcMain } from 'electron';
import { IdentityId } from '@dailyuse/domain-shared';
import { AuthMode, AuthRuntimeState } from '@dailyuse/contracts/authentication';
import { ok, fail, toIpcResult, type IpcResult } from '@dailyuse/contracts/result';
import { createLogger } from '@dailyuse/utils';
import { getWindowManager } from '../../lifecycle/window-manager';
import { getDesktopProfileRuntimeManager } from '../../profile';
import { getRememberedAccountsService, getNetworkStateManager } from './infrastructure';
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
  SEND_SMS_CODE: 'auth:send-sms-code',
} as const;

const allChannels = Object.values(Ch);

function currentAuthService() {
  return getDesktopProfileRuntimeManager().getCurrentAuthService();
}

async function transitionToMainWindowForActiveProfile(): Promise<void> {
  const runtimeManager = getDesktopProfileRuntimeManager();
  const profileId = runtimeManager.getActiveProfileId();
  const profileResolver = runtimeManager.getActiveProfileResolver();
  if (!profileId || !profileResolver) {
    throw new Error('No active profile available for main window transition');
  }

  await getWindowManager().transitionToMainWindow(profileId, profileResolver.mainWindowStatePath);
}

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
  identityId: string,
  options: { displayName?: string; identifier?: string | null; snapshotAccessToken?: string | null },
  callback: (service: AuthDesktopApplicationService) => Promise<T>,
): Promise<T> {
  const runtimeManager = getDesktopProfileRuntimeManager();
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

async function activatePreparedProfileForCurrentMode(): Promise<void> {
  const service = currentAuthService();
  if (!service) {
    throw new Error('No prepared auth service is available for activation');
  }

  const status = await service.getStatus();
  const syncMode = status.mode === AuthMode.ONLINE_USER ? 'online' : 'local';
  await getDesktopProfileRuntimeManager().activatePreparedProfile({ syncMode });
  await transitionToMainWindowForActiveProfile();
}

function mapRememberedAccounts(
  records: Awaited<ReturnType<ReturnType<typeof getRememberedAccountsService>['list']>>,
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

export function registerDesktopAuthShellHandlers(): void {
  const networkManager = getNetworkStateManager({}, logger);
  networkManager.initialize().catch((error) =>
    logger.error('NetworkStateManager init failed', { error }),
  );

  ipcMain.handle(Ch.LOGIN, async (_event, data) => {
    const runtimeManager = getDesktopProfileRuntimeManager();
    const existingProfile = await runtimeManager.findRegisteredProfileByIdentifier(String(data.email));

    try {
      if (existingProfile) {
        const result = await withPreparedProfile(
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

        await activatePreparedProfileForCurrentMode();
        return result;
      }

      const remoteResult = await loginDesktopAccount(data, {
        isOnline: () => networkManager.isOnline(),
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

      await withPreparedProfile(
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

      await getDesktopProfileRuntimeManager().activatePreparedProfile({ syncMode: 'online' });
      await transitionToMainWindowForActiveProfile();
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
    const runtimeManager = getDesktopProfileRuntimeManager();

    try {
      const result = await registerDesktopAccount(request, {
        isOnline: () => networkManager.isOnline(),
        remoteGateway,
        logger,
      });

      if (!result.ok) {
        return toIpcResult(fail(result.error));
      }

      await withPreparedProfile(
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

      await runtimeManager.activatePreparedProfile({ syncMode: 'online' });
      await transitionToMainWindowForActiveProfile();
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
    const runtimeManager = getDesktopProfileRuntimeManager();
    const service = runtimeManager.getActiveAuthService();
    const result: IpcResult<void> = service ? await service.logout() : toIpcResult(ok(undefined));

    await runtimeManager.deactivateProfile();
    await getWindowManager().transitionToLoginWindow();

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
    const runtimeManager = getDesktopProfileRuntimeManager();

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
      await transitionToMainWindowForActiveProfile();
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
    const runtimeManager = getDesktopProfileRuntimeManager();
    const remembered = await getRememberedAccountsService().getAutoLoginAccount();
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

      await activatePreparedProfileForCurrentMode();
      return result;
    } catch (error) {
      await runtimeManager.discardPreparedProfile().catch(() => undefined);
      logger.error('Auto login failed in shell auth', { error });
      return { ok: false, authenticated: false, error: String(error) };
    }
  });

  ipcMain.handle(Ch.REMEMBERED_ACCOUNTS_LIST, async () => {
    const accounts = await getRememberedAccountsService().list();
    return mapRememberedAccounts(accounts);
  });

  ipcMain.handle(Ch.REMEMBERED_ACCOUNTS_LOGIN, async (_event, request) => {
    const runtimeManager = getDesktopProfileRuntimeManager();

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

      await activatePreparedProfileForCurrentMode();
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
      await getRememberedAccountsService().remove(IdentityId.of(identityId));
      await getDesktopProfileRuntimeManager().removeProfile(identityId);
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

  ipcMain.handle(Ch.FORGOT_PASSWORD, async () =>
    toIpcResult(fail({ code: 'NOT_IMPLEMENTED', message: 'Forgot password not implemented' })),
  );
  ipcMain.handle(Ch.RESET_PASSWORD, async () =>
    toIpcResult(fail({ code: 'NOT_IMPLEMENTED', message: 'Reset password not implemented' })),
  );
  ipcMain.handle(Ch.CHANGE_PASSWORD, async () =>
    toIpcResult(fail({ code: 'NOT_IMPLEMENTED', message: 'Change password not implemented' })),
  );
  ipcMain.handle(Ch.SEND_SMS_CODE, async () =>
    toIpcResult(fail({ code: 'NOT_IMPLEMENTED', message: 'SMS not implemented' })),
  );

  logger.info(`Desktop shell auth handlers registered (${allChannels.length} channels)`);
}
