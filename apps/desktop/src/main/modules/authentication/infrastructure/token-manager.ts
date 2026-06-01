/**
 * TokenManager - Token 安全存储管理器
 *
 * 使用 Electron safeStorage API 加密存储 Token
 * 提供自动刷新、过期检查等功能
 *
 * 安全特性：
 * - 使用系统级加密（Windows: DPAPI, macOS: Keychain, Linux: libsecret）
 * - Token 永不以明文存储
 * - 支持自动刷新机制
 */

import { app, safeStorage } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createLogger } from '@dailyuse/utils/logger';
import type { ILogger } from '@dailyuse/utils/logger';
import type {
  TokenStorageData,
  SaveTokenRequest,
  TokenRefreshResult,
  TokenStatus,
} from '@dailyuse/contracts/authentication';

// ============ Type Re-exports (for convenience) ============
export type { TokenStorageData, SaveTokenRequest, TokenRefreshResult, TokenStatus };

// 内部类型别名（同时导出供其他模块使用）
export type TokenData = TokenStorageData;

// ============ Constants ============

/** 提前刷新时间：10 分钟（毫秒） */
const REFRESH_THRESHOLD_MS = 10 * 60 * 1000;

/** 默认 Refresh Token 有效期：30 天（秒） */
const DEFAULT_REFRESH_TOKEN_EXPIRES_IN = 30 * 24 * 60 * 60;

// ============ TokenManager ============

/**
 * Token 安全存储管理器
 *
 * 单例模式，确保整个应用只有一个 TokenManager 实例
 */
export class TokenManager {
  private readonly logger: ILogger;
  private tokenPath: string;
  private cachedTokenData: TokenData | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private refreshCallback: (() => Promise<TokenRefreshResult>) | null = null;

  constructor(logger?: ILogger) {
    this.logger = logger || createLogger('TokenManager');
    this.tokenPath = path.join(app.getPath('userData'), 'auth', 'tokens.enc');
    this.logger.info('TokenManager initialized', { tokenPath: this.tokenPath });
  }


  // ============ Core Methods ============

  /**
   * 保存 Token 到加密存储
   *
   * @param request - Token 保存请求
   * @throws Error - 如果加密不可用或写入失败
   */
  async saveTokens(request: SaveTokenRequest): Promise<void> {
    this.logger.debug('Saving tokens', {
      identityId: request.identityId,
      sessionId: request.sessionId,
      accessExpiresIn: request.accessTokenExpiresIn,
    });

    // 检查加密是否可用
    if (!this.isEncryptionAvailable()) {
      throw new Error('Token encryption is not available on this system');
    }

    const now = Date.now();
    const tokenData: TokenData = {
      accessToken: request.accessToken,
      refreshToken: request.refreshToken,
      accessTokenExpiresAt: now + request.accessTokenExpiresIn * 1000,
      refreshTokenExpiresAt:
        now + (request.refreshTokenExpiresIn ?? DEFAULT_REFRESH_TOKEN_EXPIRES_IN) * 1000,
      identityId: request.identityId,
      sessionId: request.sessionId,
    };

    // 加密并写入
    await this.writeEncrypted(tokenData);

    // 更新缓存
    this.cachedTokenData = tokenData;

    this.logger.info('Tokens saved successfully', {
      identityId: request.identityId,
      accessExpiresAt: new Date(tokenData.accessTokenExpiresAt).toISOString(),
    });
  }

  /**
   * 加载 Token 从加密存储
   *
   * @returns TokenData 或 null（如果不存在或已损坏）
   */
  async loadTokens(): Promise<TokenData | null> {
    // 优先返回缓存
    if (this.cachedTokenData) {
      this.logger.debug('Returning cached token data');
      return this.cachedTokenData;
    }

    try {
      const tokenData = await this.readEncrypted();
      if (tokenData) {
        this.cachedTokenData = tokenData;
        this.logger.info('Tokens loaded from encrypted storage', {
          accessTokenExpired: Date.now() > tokenData.accessTokenExpiresAt,
          refreshTokenExpired: Date.now() > tokenData.refreshTokenExpiresAt,
        });
      }
      return tokenData;
    } catch (error) {
      this.logger.error('Failed to load tokens', { error });
      return null;
    }
  }

  /**
   * 清除所有 Token
   */
  async clearTokens(): Promise<void> {
    this.logger.info('Clearing tokens');

    // 停止自动刷新
    this.stopAutoRefresh();

    // 清除缓存
    this.cachedTokenData = null;

    try {
      await fs.unlink(this.tokenPath);
      this.logger.info('Token file deleted');
    } catch (error: unknown) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== 'ENOENT') {
        this.logger.warn('Failed to delete token file', { error: err.message });
      }
    }
  }

  /**
   * 更新 Access Token（刷新后调用）
   *
   * @param accessToken - 新的 Access Token
   * @param expiresIn - 过期时间（秒）
   */
  async updateAccessToken(accessToken: string, expiresIn: number): Promise<void> {
    const tokenData = await this.loadTokens();
    if (!tokenData) {
      throw new Error('No existing token data to update');
    }

    const now = Date.now();
    tokenData.accessToken = accessToken;
    tokenData.accessTokenExpiresAt = now + expiresIn * 1000;

    await this.writeEncrypted(tokenData);
    this.cachedTokenData = tokenData;

    this.logger.info('Access token updated', {
      expiresAt: new Date(tokenData.accessTokenExpiresAt).toISOString(),
    });
  }

  /**
   * 更新 Refresh Token（Sliding Window 续期）
   *
   * @param refreshToken - 新的 Refresh Token
   * @param expiresIn - 过期时间（秒），默认 30 天
   */
  async updateRefreshToken(
    refreshToken: string,
    expiresIn: number = DEFAULT_REFRESH_TOKEN_EXPIRES_IN,
  ): Promise<void> {
    const tokenData = await this.loadTokens();
    if (!tokenData) {
      throw new Error('No existing token data to update');
    }

    const now = Date.now();
    tokenData.refreshToken = refreshToken;
    tokenData.refreshTokenExpiresAt = now + expiresIn * 1000;

    await this.writeEncrypted(tokenData);
    this.cachedTokenData = tokenData;

    this.logger.info('Refresh token updated (sliding window)', {
      expiresAt: new Date(tokenData.refreshTokenExpiresAt).toISOString(),
    });
  }

  // ============ Token Status Methods ============

  /**
   * 获取 Token 状态
   */
  async getStatus(): Promise<TokenStatus> {
    const tokenData = await this.loadTokens();

    if (!tokenData) {
      return {
        hasValidToken: false,
        isAccessTokenExpired: true,
        isRefreshTokenExpired: true,
        shouldRefresh: false,
        accessTokenRemainingMs: 0,
        refreshTokenRemainingMs: 0,
      };
    }

    const now = Date.now();
    const accessTokenRemainingMs = Math.max(0, tokenData.accessTokenExpiresAt - now);
    const refreshTokenRemainingMs = Math.max(0, tokenData.refreshTokenExpiresAt - now);
    const isAccessTokenExpired = accessTokenRemainingMs === 0;
    const isRefreshTokenExpired = refreshTokenRemainingMs === 0;

    return {
      hasValidToken: !isRefreshTokenExpired,
      isAccessTokenExpired,
      isRefreshTokenExpired,
      shouldRefresh: !isAccessTokenExpired && accessTokenRemainingMs < REFRESH_THRESHOLD_MS,
      accessTokenRemainingMs,
      refreshTokenRemainingMs,
    };
  }

  /**
   * 检查是否应该刷新 Token（提前 10 分钟）
   */
  async shouldRefresh(): Promise<boolean> {
    const status = await this.getStatus();
    return status.shouldRefresh || (status.isAccessTokenExpired && !status.isRefreshTokenExpired);
  }

  /**
   * 检查是否有有效的 Token（Refresh Token 未过期）
   */
  async hasValidTokens(): Promise<boolean> {
    const status = await this.getStatus();
    return status.hasValidToken;
  }

  /**
   * 获取当前 Access Token（如果有效）
   */
  async getAccessToken(): Promise<string | null> {
    const tokenData = await this.loadTokens();
    if (!tokenData || Date.now() > tokenData.accessTokenExpiresAt) {
      return null;
    }
    return tokenData.accessToken;
  }

  /**
   * 获取当前 Refresh Token（如果有效）
   */
  async getRefreshToken(): Promise<string | null> {
    const tokenData = await this.loadTokens();
    if (!tokenData || Date.now() > tokenData.refreshTokenExpiresAt) {
      return null;
    }
    return tokenData.refreshToken;
  }

  // ============ Auto Refresh ============

  /**
   * 启动自动刷新定时器
   *
   * @param refreshCallback - 刷新 Token 的回调函数
   */
  startAutoRefresh(refreshCallback: () => Promise<TokenRefreshResult>): void {
    this.refreshCallback = refreshCallback;
    this.scheduleNextRefresh();
    this.logger.info('Auto refresh started');
  }

  /**
   * 停止自动刷新
   */
  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.refreshCallback = null;
    this.logger.info('Auto refresh stopped');
  }

  /**
   * 手动触发刷新
   */
  async triggerRefresh(): Promise<TokenRefreshResult> {
    if (!this.refreshCallback) {
      return { ok: false, error: 'No refresh callback registered' };
    }

    this.logger.info('Triggering token refresh');
    const result = await this.refreshCallback();

    if (result.ok && result.accessToken && result.expiresAt) {
      const expiresIn = Math.floor((result.expiresAt - Date.now()) / 1000);
      await this.updateAccessToken(result.accessToken, expiresIn);
      this.scheduleNextRefresh();
    }

    return result;
  }

  // ============ Utility Methods ============

  /**
   * 检查加密是否可用
   */
  isEncryptionAvailable(): boolean {
    return safeStorage.isEncryptionAvailable();
  }

  /**
   * 获取 Token 存储路径
   */
  getTokenPath(): string {
    return this.tokenPath;
  }

  /**
   * Switch to a profile's token storage.
   * Stops auto-refresh, clears cache, and updates the token path.
   */
  switchToProfile(tokenPath: string): void {
    this.logger.info('Switching to profile token path', { tokenPath });
    this.stopAutoRefresh();
    this.cachedTokenData = null;
    this.tokenPath = tokenPath;
  }

  /**
   * Clear state for a profile switch without deleting the token file.
   * Used during deactivation (not logout).
   */
  async clearForProfileSwitch(): Promise<void> {
    this.logger.info('Clearing for profile switch');
    this.stopAutoRefresh();
    this.cachedTokenData = null;
  }

  getCachedTokenData(): TokenData | null {
    return this.cachedTokenData;
  }

  // ============ Private Methods ============

  /**
   * 写入加密数据
   */
  private async writeEncrypted(data: TokenData): Promise<void> {
    // 确保目录存在
    const dir = path.dirname(this.tokenPath);
    await fs.mkdir(dir, { recursive: true });

    // 序列化并加密
    const json = JSON.stringify(data);
    const encrypted = safeStorage.encryptString(json);

    // 写入文件
    await fs.writeFile(this.tokenPath, encrypted);
  }

  /**
   * 读取并解密数据
   */
  private async readEncrypted(): Promise<TokenData | null> {
    try {
      // 检查文件是否存在
      await fs.access(this.tokenPath);

      // 读取加密数据
      const encrypted = await fs.readFile(this.tokenPath);

      // 解密
      const json = safeStorage.decryptString(encrypted);

      // 解析
      const data = JSON.parse(json) as TokenData;

      // 验证数据结构
      if (!this.isValidTokenData(data)) {
        this.logger.warn('Invalid token data structure, clearing');
        await this.clearTokens();
        return null;
      }

      return data;
    } catch (error: unknown) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        this.logger.debug('Token file does not exist');
        return null;
      }
      throw error;
    }
  }

  /**
   * 验证 Token 数据结构
   */
  private isValidTokenData(data: unknown): data is TokenData {
    return (
      typeof data === 'object' &&
      data !== null &&
      'accessToken' in data &&
      'refreshToken' in data &&
      typeof (data as TokenData).accessToken === 'string' &&
      typeof (data as TokenData).refreshToken === 'string' &&
      typeof (data as TokenData).accessTokenExpiresAt === 'number' &&
      typeof (data as TokenData).refreshTokenExpiresAt === 'number' &&
      typeof (data as TokenData).identityId === 'string' &&
      typeof (data as TokenData).sessionId === 'string'
    );
  }

  /**
   * 计划下一次刷新
   */
  private async scheduleNextRefresh(): Promise<void> {
    // 清除现有定时器
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    const tokenData = await this.loadTokens();
    if (!tokenData || !this.refreshCallback) {
      return;
    }

    const now = Date.now();
    const refreshAt = tokenData.accessTokenExpiresAt - REFRESH_THRESHOLD_MS;
    const delay = Math.max(0, refreshAt - now);

    if (delay > 0 && delay < 2147483647) {
      // setTimeout 最大值
      this.refreshTimer = setTimeout(async () => {
        await this.triggerRefresh();
      }, delay);

      this.logger.debug('Scheduled next refresh', {
        delay,
        refreshAt: new Date(refreshAt).toISOString(),
      });
    }
  }
}

// ============ Exports ============
