/**
 * Authentication IPC 处理器
 * 处理所有与认证相关的 IPC 请求
 * 
 * 注意：AuthDesktopApplicationService 现在直接返回 IpcResult 格式，
 * 所以不需要通过 handleRequest 再包装一层。
 */

import { ipcMain } from 'electron';
import { createLogger } from '@dailyuse/utils';
import { AuthDesktopApplicationService, type LoginCredentials, type RegisterRequest } from '../application/AuthDesktopApplicationService';

const logger = createLogger('AuthIPCHandler');

export class AuthIPCHandler {
  private authService: AuthDesktopApplicationService;

  constructor() {
    this.authService = new AuthDesktopApplicationService();
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // 登录 - 返回 IpcResult<{ accountUuid, sessionUuid }>
    ipcMain.handle('auth:login', async (_event, credentials: LoginCredentials) => {
      return this.authService.login(credentials);
    });

    // 登出 - 返回 IpcResult<void>
    ipcMain.handle('auth:logout', async () => {
      return this.authService.logout();
    });

    // 注册 - 返回 IpcResult<{ accountUuid, message }>
    ipcMain.handle('auth:register', async (_event, request: RegisterRequest) => {
      return this.authService.register(request);
    });

    // 进入离线模式 - 返回 IpcResult<{ accountUuid, mode, message }>
    ipcMain.handle('auth:enter-offline-mode', async () => {
      return this.authService.enterOfflineMode();
    });

    // 获取认证状态 - 返回 AuthStatus（不变）
    ipcMain.handle('auth:get-status', async () => {
      return this.authService.getStatus();
    });

    // 验证令牌 - 返回 { valid, error? }（不变）
    ipcMain.handle('auth:verify-token', async (_event, token: string) => {
      return this.authService.verifyToken(token);
    });

    // 刷新令牌 - 返回 IpcResult<{ accessToken, expiresIn }>
    ipcMain.handle('auth:refresh-token', async () => {
      return this.authService.refreshToken();
    });

    // 2FA 操作
    ipcMain.handle('auth:get-2fa-status', async () => {
      return this.authService.get2FAStatus();
    });

    ipcMain.handle('auth:enable-2fa', async (_event, method: string) => {
      return this.authService.enable2FA(method);
    });

    ipcMain.handle('auth:verify-2fa', async (_event, code: string) => {
      return this.authService.verify2FA(code);
    });

    ipcMain.handle('auth:disable-2fa', async () => {
      return this.authService.disable2FA();
    });

    // Session 管理
    ipcMain.handle('auth:list-sessions', async () => {
      return this.authService.listSessions();
    });

    ipcMain.handle('auth:get-current-session', async () => {
      return this.authService.getCurrentSession();
    });

    ipcMain.handle('auth:revoke-session', async (_event, sessionId: string) => {
      return this.authService.revokeSession(sessionId);
    });

    ipcMain.handle('auth:revoke-all-sessions', async () => {
      return this.authService.revokeAllSessions();
    });

    // API Key 管理
    ipcMain.handle('auth:create-api-key', async (_event, payload: { name: string; scopes?: string[] }) => {
      return this.authService.createApiKey(payload);
    });

    ipcMain.handle('auth:list-api-keys', async () => {
      return this.authService.listApiKeys();
    });

    ipcMain.handle('auth:revoke-api-key', async (_event, keyId: string) => {
      return this.authService.revokeApiKey(keyId);
    });

    // 设备管理
    ipcMain.handle('auth:get-current-device', async () => {
      return this.authService.getCurrentDevice();
    });

    logger.info('Registered Auth IPC handlers');
  }
}

export const authIPCHandler = new AuthIPCHandler();
