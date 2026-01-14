/**
 * Authentication IPC 处理器
 * 处理所有与认证相关的 IPC 请求
 */

import { ipcMain } from 'electron';
import { BaseIPCHandler } from '../../shared/application/base-ipc-handler';
import { AuthDesktopApplicationService, type LoginCredentials, type RegisterRequest } from '../application/AuthDesktopApplicationService';

export class AuthIPCHandler extends BaseIPCHandler {
  private authService: AuthDesktopApplicationService;

  constructor() {
    super('AuthIPCHandler');
    this.authService = new AuthDesktopApplicationService();
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // 登录
    ipcMain.handle('auth:login', async (event, credentials: LoginCredentials) => {
      return this.handleRequest(
        'auth:login',
        () => this.authService.login(credentials),
      );
    });

    // 登出
    ipcMain.handle('auth:logout', async () => {
      return this.handleRequest(
        'auth:logout',
        () => this.authService.logout(),
      );
    });

    // 注册
    ipcMain.handle('auth:register', async (event, request: RegisterRequest) => {
      return this.handleRequest(
        'auth:register',
        () => this.authService.register(request),
      );
    });

    // 进入离线模式
    ipcMain.handle('auth:enter-offline-mode', async () => {
      return this.handleRequest(
        'auth:enter-offline-mode',
        () => this.authService.enterOfflineMode(),
      );
    });

    // 获取认证状态
    ipcMain.handle('auth:get-status', async () => {
      return this.handleRequest(
        'auth:get-status',
        () => this.authService.getStatus(),
      );
    });

    // 验证令牌
    ipcMain.handle('auth:verify-token', async (event, token: string) => {
      return this.handleRequest(
        'auth:verify-token',
        () => this.authService.verifyToken(token),
      );
    });

    // 刷新令牌
    ipcMain.handle('auth:refresh-token', async () => {
      return this.handleRequest(
        'auth:refresh-token',
        () => this.authService.refreshToken(),
      );
    });

    // 2FA 操作
    ipcMain.handle('auth:get-2fa-status', async () => {
      return this.handleRequest(
        'auth:get-2fa-status',
        () => this.authService.get2FAStatus(),
      );
    });

    ipcMain.handle('auth:enable-2fa', async (event, method: string) => {
      return this.handleRequest(
        'auth:enable-2fa',
        () => this.authService.enable2FA(method),
      );
    });

    ipcMain.handle('auth:verify-2fa', async (event, code: string) => {
      return this.handleRequest(
        'auth:verify-2fa',
        () => this.authService.verify2FA(code),
      );
    });

    ipcMain.handle('auth:disable-2fa', async () => {
      return this.handleRequest(
        'auth:disable-2fa',
        () => this.authService.disable2FA(),
      );
    });

    // Session 管理
    ipcMain.handle('auth:list-sessions', async () => {
      return this.handleRequest(
        'auth:list-sessions',
        () => this.authService.listSessions(),
      );
    });

    ipcMain.handle('auth:get-current-session', async () => {
      return this.handleRequest(
        'auth:get-current-session',
        () => this.authService.getCurrentSession(),
      );
    });

    ipcMain.handle('auth:revoke-session', async (event, sessionId: string) => {
      return this.handleRequest(
        'auth:revoke-session',
        () => this.authService.revokeSession(sessionId),
      );
    });

    ipcMain.handle('auth:revoke-all-sessions', async () => {
      return this.handleRequest(
        'auth:revoke-all-sessions',
        () => this.authService.revokeAllSessions(),
      );
    });

    // API Key 管理
    ipcMain.handle('auth:create-api-key', async (event, payload: { name: string; scopes?: string[] }) => {
      return this.handleRequest(
        'auth:create-api-key',
        () => this.authService.createApiKey(payload),
      );
    });

    ipcMain.handle('auth:list-api-keys', async () => {
      return this.handleRequest(
        'auth:list-api-keys',
        () => this.authService.listApiKeys(),
      );
    });

    ipcMain.handle('auth:revoke-api-key', async (event, keyId: string) => {
      return this.handleRequest(
        'auth:revoke-api-key',
        () => this.authService.revokeApiKey(keyId),
      );
    });

    // 设备管理
    ipcMain.handle('auth:get-current-device', async () => {
      return this.handleRequest(
        'auth:get-current-device',
        () => this.authService.getCurrentDevice(),
      );
    });

    this.logger.info('Registered Auth IPC handlers');
  }
}

export const authIPCHandler = new AuthIPCHandler();
