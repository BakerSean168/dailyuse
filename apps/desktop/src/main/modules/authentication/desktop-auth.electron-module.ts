/**
 * Desktop Authentication Electron Module
 *
 * Unified IElectronModule that replaces the shared AuthenticationElectronModule
 * and the never-activated desktop auth handlers.
 *
 * Core auth (login, register, logout, refresh) uses the shared AuthenticationModule
 * for local SQLite operations, returning proper AuthResponseDTO.
 *
 * Desktop-specific features (guest mode, network-aware status, token management,
 * session management, 2FA stubs, API key stubs) are handled by
 * AuthDesktopApplicationService.
 *
 * @module desktop-auth
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import {
  SqliteAuthIdentityRepository,
  SqliteAuthSessionRepository,
} from '@dailyuse/authentication/sqlite';
import {
  Argon2Hasher,
  AuthenticationModule,
  AuthenticationContainer,
  JwtTokenProvider,
} from '@dailyuse/authentication/infrastructure-server';
import { ok, fail } from '@dailyuse/contracts/result';
import { createLogger } from '@dailyuse/utils';
import type { Context } from '@dailyuse/contracts/shared';
import {
  AuthDesktopApplicationService,
} from './application/AuthDesktopApplicationService';
import { getNetworkStateManager } from './infrastructure';

const logger = createLogger('DesktopAuthElectron');

// ── Channel Registry ─────────────────────────────────────────────

const Ch = {
  // Core auth (shared module — returns AuthResponseDTO)
  LOGIN: 'auth:login',
  REGISTER: 'auth:register',
  LOGOUT: 'auth:logout',
  REFRESH_TOKEN: 'auth:refresh-token',

  // Desktop-specific (AuthDesktopApplicationService)
  ENTER_GUEST_MODE: 'auth:enter-guest-mode',
  ENTER_OFFLINE_MODE: 'auth:enter-offline-mode',
  GET_STATUS: 'auth:get-status',
  INITIALIZE: 'auth:initialize',
  AUTO_LOGIN: 'auth:auto-login',
  VERIFY_TOKEN: 'auth:verify-token',
  TOKEN_STATUS: 'auth:token-status',
  SESSION_STATUS: 'auth:session-status',
  CLEANUP_SESSIONS: 'auth:cleanup-sessions',

  // 2FA (stubs)
  TFA_ENABLE: 'auth:2fa:enable',
  TFA_DISABLE: 'auth:2fa:disable',
  TFA_VERIFY: 'auth:2fa:verify',
  TFA_GET_STATUS: 'auth:2fa:get-status',
  TFA_BACKUP_CODES: 'auth:2fa:generate-backup-codes',

  // API Keys (stubs)
  API_KEY_CREATE: 'auth:api-key:create',
  API_KEY_LIST: 'auth:api-key:list',
  API_KEY_REVOKE: 'auth:api-key:revoke',
  API_KEY_ROTATE: 'auth:api-key:rotate',

  // Sessions
  SESSION_LIST: 'auth:session:list',
  SESSION_GET_CURRENT: 'auth:session:get-current',
  SESSION_REVOKE: 'auth:session:revoke',
  SESSION_REVOKE_ALL: 'auth:session:revoke-all',

  // Devices
  DEVICE_LIST: 'auth:device:list',
  DEVICE_GET_CURRENT: 'auth:device:get-current',
  DEVICE_TRUST: 'auth:device:trust',
  DEVICE_REVOKE: 'auth:device:revoke',
  DEVICE_RENAME: 'auth:device:rename',

  // Password (stubs)
  FORGOT_PASSWORD: 'auth:forgot-password',
  RESET_PASSWORD: 'auth:reset-password',
  CHANGE_PASSWORD: 'auth:change-password',

  // SMS (stub)
  SEND_SMS_CODE: 'auth:send-sms-code',
} as const;

const allChannels = Object.values(Ch);

// ── Module ───────────────────────────────────────────────────────

export const DesktopAuthElectronModule: IElectronModule = {
  name: 'DesktopAuthentication',

  register(ctx: IElectronModuleContext): void {
    const { db } = ctx;

    // ── 1. Shared infrastructure ────────────────────────────────
    const identityRepository = new SqliteAuthIdentityRepository(db);
    const sessionRepository = new SqliteAuthSessionRepository(db);
    const passwordHasher = new Argon2Hasher();

    const accessSecret = process.env.JWT_ACCESS_SECRET || 'desktop-access-secret-key';
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'desktop-refresh-secret-key';
    if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
      logger.warn('JWT secrets not configured — using defaults (development only)');
    }
    const tokenProvider = new JwtTokenProvider(
      accessSecret,
      refreshSecret,
      15 * 60 * 1000,  // 15 min access token
      7 * 24 * 60 * 60 * 1000, // 7 days refresh token
    );

    // 2. Shared AuthenticationModule (login/register/logout/refresh use cases)
    const authModule = new AuthenticationModule({
      identityRepository,
      sessionRepository,
      passwordHasher,
      tokenProvider,
    });

    // 3. Desktop Application Service (guest mode, token/session mgmt, etc.)
    const desktopService = new AuthDesktopApplicationService(logger);
    desktopService.setRepositories(sessionRepository, identityRepository);
    desktopService.setOfflineAuthDependencies(identityRepository, passwordHasher);

    // 4. Initialize network state
    const networkManager = getNetworkStateManager({}, logger);
    networkManager.initialize().catch((err) =>
      logger.error('NetworkStateManager init failed', { error: err }),
    );

    const electronContext: Context = { identityId: '', deviceId: 'electron-app' };

    // ══════════════════════════════════════════════════════════════
    // Core Auth Handlers (shared AuthenticationModule → AuthResponseDTO)
    // ══════════════════════════════════════════════════════════════

    ipcMain.handle(Ch.LOGIN, async (_event, data) => {
      try {
        const result = await authModule.login.execute(
          { email: data.email, password: data.password },
          { ...electronContext, deviceId: 'electron-app' },
        );
        return ok(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error('Login failed', { error: message });
        return fail({ code: 'LOGIN_FAILED', message });
      }
    });

    ipcMain.handle(Ch.REGISTER, async (_event, data) => {
      // Registration requires network
      if (!networkManager.isOnline()) {
        return fail({
          code: 'OFFLINE',
          message: '注册需要网络连接，请检查网络后重试。离线状态下可使用访客模式。',
        });
      }
      try {
        const result = await authModule.register.execute(data, electronContext);
        return ok(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const code = message.toLowerCase().includes('already exists') ? 'CONFLICT' : 'REGISTER_FAILED';
        logger.error('Register failed', { error: message });
        return fail({ code, message });
      }
    });

    ipcMain.handle(Ch.LOGOUT, async (_event, cx?: Partial<Context>) => {
      try {
        await authModule.logout.execute(undefined as void, { ...electronContext, ...cx });
        // Also clean up desktop service state
        await desktopService.logout();
        return ok(undefined);
      } catch (err) {
        logger.error('Logout failed', { error: err });
        return fail({ code: 'LOGOUT_FAILED', message: err instanceof Error ? err.message : String(err) });
      }
    });

    ipcMain.handle(Ch.REFRESH_TOKEN, async (_event, data) => {
      try {
        const result = await authModule.refreshToken.execute(data, electronContext);
        return ok(result);
      } catch (err) {
        logger.error('Refresh token failed', { error: err });
        return fail({ code: 'REFRESH_FAILED', message: err instanceof Error ? err.message : String(err) });
      }
    });

    // ══════════════════════════════════════════════════════════════
    // Desktop-Specific Handlers (AuthDesktopApplicationService)
    // ══════════════════════════════════════════════════════════════

    ipcMain.handle(Ch.ENTER_GUEST_MODE, () => desktopService.enterGuestMode());
    ipcMain.handle(Ch.ENTER_OFFLINE_MODE, () => desktopService.enterGuestMode());
    ipcMain.handle(Ch.GET_STATUS, () => desktopService.getStatus());
    ipcMain.handle(Ch.INITIALIZE, () => desktopService.initialize());
    ipcMain.handle(Ch.AUTO_LOGIN, () => desktopService.autoLogin());
    ipcMain.handle(Ch.VERIFY_TOKEN, (_event, token: string) => desktopService.verifyToken(token));
    ipcMain.handle(Ch.TOKEN_STATUS, () => desktopService.getTokenStatus());
    ipcMain.handle(Ch.SESSION_STATUS, () => desktopService.getSessionStatus());
    ipcMain.handle(Ch.CLEANUP_SESSIONS, () => desktopService.cleanupExpiredSessions());

    // 2FA (stubs)
    ipcMain.handle(Ch.TFA_ENABLE, (_event, method: string) => desktopService.enable2FA(method || 'totp'));
    ipcMain.handle(Ch.TFA_DISABLE, () => desktopService.disable2FA());
    ipcMain.handle(Ch.TFA_VERIFY, (_event, code: string) => desktopService.verify2FA(code));
    ipcMain.handle(Ch.TFA_GET_STATUS, () => desktopService.get2FAStatus());
    ipcMain.handle(Ch.TFA_BACKUP_CODES, () => desktopService.generateBackupCodes());

    // API Keys (stubs)
    ipcMain.handle(Ch.API_KEY_CREATE, (_event, req: { name: string; scopes?: string[] }) =>
      desktopService.createApiKey(req));
    ipcMain.handle(Ch.API_KEY_LIST, () => desktopService.listApiKeys());
    ipcMain.handle(Ch.API_KEY_REVOKE, (_event, keyId: string) => desktopService.revokeApiKey(keyId));
    ipcMain.handle(Ch.API_KEY_ROTATE, (_event, keyId: string) => desktopService.rotateApiKey(keyId));

    // Sessions
    ipcMain.handle(Ch.SESSION_LIST, () => desktopService.listSessions());
    ipcMain.handle(Ch.SESSION_GET_CURRENT, () => desktopService.getCurrentSession());
    ipcMain.handle(Ch.SESSION_REVOKE, (_event, sessionId: string) => desktopService.revokeSession(sessionId));
    ipcMain.handle(Ch.SESSION_REVOKE_ALL, () => desktopService.revokeAllSessions());

    // Devices
    ipcMain.handle(Ch.DEVICE_LIST, () => desktopService.listDevices());
    ipcMain.handle(Ch.DEVICE_GET_CURRENT, () => desktopService.getCurrentDevice());
    ipcMain.handle(Ch.DEVICE_TRUST, () =>
      fail({ code: 'NOT_IMPLEMENTED', message: 'Device trust not implemented' }));
    ipcMain.handle(Ch.DEVICE_REVOKE, (_event, deviceId: string) => desktopService.revokeDevice(deviceId));
    ipcMain.handle(Ch.DEVICE_RENAME, (_event, data: { deviceId: string; name: string }) =>
      desktopService.renameDevice(data.deviceId, data.name));

    // Password (stubs)
    ipcMain.handle(Ch.FORGOT_PASSWORD, () =>
      fail({ code: 'NOT_IMPLEMENTED', message: 'Forgot password not implemented' }));
    ipcMain.handle(Ch.RESET_PASSWORD, () =>
      fail({ code: 'NOT_IMPLEMENTED', message: 'Reset password not implemented' }));
    ipcMain.handle(Ch.CHANGE_PASSWORD, () =>
      fail({ code: 'NOT_IMPLEMENTED', message: 'Change password not implemented' }));

    // SMS (stub)
    ipcMain.handle(Ch.SEND_SMS_CODE, () =>
      fail({ code: 'NOT_IMPLEMENTED', message: 'SMS not implemented' }));

    logger.info(`Desktop Authentication module registered (${allChannels.length} channels)`);
  },

  destroy(): void {
    for (const ch of allChannels) {
      ipcMain.removeHandler(ch);
    }
    AuthenticationContainer.getInstance().reset();
    logger.info('Desktop Authentication module destroyed');
  },
};
