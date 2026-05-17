/**
 * Desktop Authentication Electron Module
 *
 * Unified IElectronModule that replaces the shared AuthenticationElectronModule
 * and the never-activated desktop auth handlers.
 *
 * Core auth (login, register, logout, refresh) is routed through the desktop
 * application service so online and offline behavior stays in one place.
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
  PowerSyncAuthIdentityRepository,
  PowerSyncAuthSessionRepository,
  Argon2Hasher,
} from '@dailyuse/authentication/infrastructure-server';
import { fail, ok, toIpcResult } from '@dailyuse/contracts/result';
import { createLogger } from '@dailyuse/utils';
import { AuthDesktopApplicationService } from './application/AuthDesktopApplicationService';
import { getNetworkStateManager } from './infrastructure';
import {
  clearDesktopAuthService,
  registerDesktopAuthService,
} from '../../auth/desktop-auth-context';
import { PowerSyncAccountRepository } from '@dailyuse/account/infrastructure-server';

const logger = createLogger('DesktopAuthElectron');

// ── Channel Registry ─────────────────────────────────────────────

const Ch = {
  // Core auth
  LOGIN: 'auth:login',
  REGISTER: 'auth:register',
  LOGOUT: 'auth:logout',
  REFRESH_TOKEN: 'auth:refresh-token',

  // Desktop-specific (AuthDesktopApplicationService)
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

// ── Module-level state (lifecycle-managed references) ────────────
// 模块级状态（生命周期管理的引用）
// These are set during register() and cleaned up during destroy(),
// following the same pattern as GovernanceElectronModule.
// 在 register() 中赋值，在 destroy() 中清理，与治理模块保持一致。
let activeDesktopService: AuthDesktopApplicationService | null = null;
let activeNetworkManager: ReturnType<typeof getNetworkStateManager> | null = null;

// ── Module ───────────────────────────────────────────────────────

export const DesktopAuthElectronModule: IElectronModule = {
  name: 'DesktopAuthentication',

  register(ctx: IElectronModuleContext): void {
    const { db } = ctx;

    // ── 1. Shared infrastructure ────────────────────────────────
    const identityRepository = new PowerSyncAuthIdentityRepository(db);
    const sessionRepository = new PowerSyncAuthSessionRepository(db);
    const accountRepository = new PowerSyncAccountRepository(db as any);
    const passwordHasher = new Argon2Hasher();

    // 2. Desktop Application Service (guest mode, token/session mgmt, etc.)
    // 桌面应用服务（访客模式、令牌/会话管理等）
    const desktopService = new AuthDesktopApplicationService(logger);
    desktopService.setRepositories(sessionRepository, identityRepository);
    desktopService.setAccountRepository(accountRepository);
    desktopService.setOfflineAuthDependencies(identityRepository, passwordHasher);
    registerDesktopAuthService(desktopService);
    activeDesktopService = desktopService;

    // 3. Initialize network state — retained for lifecycle cleanup in destroy().
    // 初始化网络状态 — 保留引用以便在 destroy() 中清理。
    const networkManager = getNetworkStateManager({}, logger);
    networkManager
      .initialize()
      .catch((err) => logger.error('NetworkStateManager init failed', { error: err }));
    activeNetworkManager = networkManager;

    // ══════════════════════════════════════════════════════════════
    // Core Auth Handlers
    // ══════════════════════════════════════════════════════════════

    ipcMain.handle(Ch.LOGIN, (_event, data) => desktopService.login(data));

    ipcMain.handle(Ch.REGISTER, (_event, data) => desktopService.register(data));

    ipcMain.handle(Ch.LOGOUT, async () => {
      logger.info('IPC auth:logout received');
      const result = await desktopService.logout();
      logger.info('IPC auth:logout completed', { ok: result.ok });
      return result;
    });

    ipcMain.handle(Ch.REFRESH_TOKEN, () => desktopService.refreshToken());

    // ══════════════════════════════════════════════════════════════
    // Desktop-Specific Handlers (AuthDesktopApplicationService)
    // ══════════════════════════════════════════════════════════════

    ipcMain.handle(Ch.ENTER_GUEST_MODE, () => desktopService.enterGuestMode());
    ipcMain.handle(Ch.GET_STATUS, () => desktopService.getStatus());
    ipcMain.handle(Ch.GET_BOOTSTRAP_SNAPSHOT, () => desktopService.buildBootstrapSnapshot());
    ipcMain.handle(Ch.INITIALIZE, () => desktopService.initialize());
    ipcMain.handle(Ch.AUTO_LOGIN, async () => toIpcResult(ok(await desktopService.autoLogin())));
    ipcMain.handle(Ch.REMEMBERED_ACCOUNTS_LIST, () => desktopService.getRememberedAccounts());
    ipcMain.handle(Ch.REMEMBERED_ACCOUNTS_LOGIN, (_event, request) =>
      desktopService.loginRememberedAccount(request),
    );
    ipcMain.handle(Ch.REMEMBERED_ACCOUNTS_REMOVE, (_event, identityId: string) =>
      desktopService.removeRememberedAccount(identityId),
    );
    ipcMain.handle(Ch.VERIFY_TOKEN, (_event, token: string) => desktopService.verifyToken(token));
    ipcMain.handle(Ch.TOKEN_STATUS, () => desktopService.getTokenStatus());
    ipcMain.handle(Ch.SESSION_STATUS, () => desktopService.getSessionStatus());
    ipcMain.handle(Ch.CLEANUP_SESSIONS, () => desktopService.cleanupExpiredSessions());

    // 2FA (stubs)
    ipcMain.handle(Ch.TFA_ENABLE, (_event, method: string) =>
      desktopService.enable2FA(method || 'totp'),
    );
    ipcMain.handle(Ch.TFA_DISABLE, () => desktopService.disable2FA());
    ipcMain.handle(Ch.TFA_VERIFY, (_event, code: string) => desktopService.verify2FA(code));
    ipcMain.handle(Ch.TFA_GET_STATUS, () => desktopService.get2FAStatus());
    ipcMain.handle(Ch.TFA_BACKUP_CODES, () => desktopService.generateBackupCodes());

    // API Keys (stubs)
    ipcMain.handle(Ch.API_KEY_CREATE, (_event, req: { name: string; scopes?: string[] }) =>
      desktopService.createApiKey(req),
    );
    ipcMain.handle(Ch.API_KEY_LIST, () => desktopService.listApiKeys());
    ipcMain.handle(Ch.API_KEY_REVOKE, (_event, keyId: string) =>
      desktopService.revokeApiKey(keyId),
    );
    ipcMain.handle(Ch.API_KEY_ROTATE, (_event, keyId: string) =>
      desktopService.rotateApiKey(keyId),
    );

    // Sessions
    ipcMain.handle(Ch.SESSION_LIST, () => desktopService.listSessions());
    ipcMain.handle(Ch.SESSION_GET_CURRENT, () => desktopService.getCurrentSession());
    ipcMain.handle(Ch.GET_CURRENT_USER, () => desktopService.getCurrentUser());
    ipcMain.handle(Ch.SESSION_REVOKE, (_event, payload: string | { sessionId: string }) =>
      desktopService.revokeSession(typeof payload === 'string' ? payload : payload?.sessionId),
    );
    ipcMain.handle(Ch.SESSION_REVOKE_ALL, () => desktopService.revokeAllSessions());

    // Devices
    ipcMain.handle(Ch.DEVICE_LIST, () => desktopService.listDevices());
    ipcMain.handle(Ch.DEVICE_GET_CURRENT, () => desktopService.getCurrentDevice());
    ipcMain.handle(Ch.DEVICE_TRUST, () =>
      fail({ code: 'NOT_IMPLEMENTED', message: 'Device trust not implemented' }),
    );
    ipcMain.handle(Ch.DEVICE_REVOKE, (_event, deviceId: string) =>
      desktopService.revokeDevice(deviceId),
    );
    ipcMain.handle(Ch.DEVICE_RENAME, (_event, data: { deviceId: string; name: string }) =>
      desktopService.renameDevice(data.deviceId, data.name),
    );

    // Password (stubs)
    ipcMain.handle(Ch.FORGOT_PASSWORD, () =>
      fail({ code: 'NOT_IMPLEMENTED', message: 'Forgot password not implemented' }),
    );
    ipcMain.handle(Ch.RESET_PASSWORD, () =>
      fail({ code: 'NOT_IMPLEMENTED', message: 'Reset password not implemented' }),
    );
    ipcMain.handle(Ch.CHANGE_PASSWORD, () =>
      fail({ code: 'NOT_IMPLEMENTED', message: 'Change password not implemented' }),
    );

    // SMS (stub)
    ipcMain.handle(Ch.SEND_SMS_CODE, () =>
      fail({ code: 'NOT_IMPLEMENTED', message: 'SMS not implemented' }),
    );

    logger.info(`Desktop Authentication module registered (${allChannels.length} channels)`);
  },

  destroy(): void {
    // 1. Remove all IPC handlers.
    // 移除所有 IPC 处理器。
    for (const ch of allChannels) {
      ipcMain.removeHandler(ch);
    }

    // 2. Clean up desktop service (stops session timers, resets state).
    // 清理桌面服务（停止会话计时器、重置状态）。
    activeDesktopService?.cleanup();
    activeDesktopService = null;

    // 3. Clean up network manager (stops health-check interval, removes listeners).
    // 清理网络管理器（停止健康检查定时器、移除监听器）。
    activeNetworkManager?.cleanup();
    activeNetworkManager = null;

    // 4. Clear the global desktop auth service reference.
    // 清除全局桌面认证服务引用。
    clearDesktopAuthService();

    logger.info('Desktop Authentication module destroyed');
  },
};
