/**
 * Refresh Token Service
 *
 * 刷新访问令牌应用服务
 *
 * 提供两种接口：
 * - execute(): 用于 Desktop 客户端（简化版本）
 * - executeForWeb(): 用于 Web API（JWT token 刷新）
 */

import type { IAuthSessionRepository } from '@dailyuse/domain-server/authentication';
import type { RefreshTokenRequest, AuthTokens } from '@dailyuse/contracts/authentication';
import { createLogger } from '@dailyuse/utils';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const logger = createLogger('RefreshToken');

/**
 * Refresh Token Service
 */
export class RefreshToken {
  constructor(private readonly sessionRepository: IAuthSessionRepository) {}

  /**
   * 执行令牌刷新
   */
  async execute(input: RefreshTokenRequest): Promise<{ tokens: AuthTokens }> {
    // 1. 查找会话
    const session = await this.sessionRepository.findByRefreshToken(input.refreshToken);
    if (!session) {
      throw new Error('Invalid or expired refresh token');
    }

    // 2. 检查会话状态
    if (session.status !== 'ACTIVE') {
      throw new Error('Session is not active');
    }

    // 3. 检查刷新令牌是否过期
    if (session.isRefreshTokenExpired()) {
      throw new Error('Refresh token has expired');
    }

    // 4. 刷新令牌（使用 domain 方法）
    session.refreshRefreshToken();

    // 5. 保存会话
    await this.sessionRepository.save(session);

    // 6. 返回新令牌
    return {
      tokens: {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken.token,
      },
    };
  }

  /**
   * 执行令牌刷新 (Web API 版本 - 从 apps/api 迁移)
   *
   * 使用 JWT refresh token 刷新 access token
   */
  async executeForWeb(params: { refreshToken: string }): Promise<{
    success: boolean;
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    message: string;
  }> {
    logger.info('[RefreshToken] Starting web token refresh');

    try {
      // 1. 查找会话
      const session = await this.sessionRepository.findByRefreshToken(params.refreshToken);
      if (!session) {
        throw new Error('Invalid or expired refresh token');
      }

      // 2. 检查会话状态
      if (session.status !== 'ACTIVE') {
        throw new Error('Session is not active');
      }

      // 3. 生成新的 JWT tokens
      const secret = process.env.JWT_SECRET || 'your-secret-key-here-change-in-production';
      const accessTokenExpiresIn = 3600; // 1 hour
      const refreshTokenExpiresIn = 30 * 24 * 3600; // 30 days
      const expiresAt = Date.now() + accessTokenExpiresIn * 1000;
      const now = Math.floor(Date.now() / 1000);

      const accessToken = jwt.sign(
        {
          accountUuid: session.accountUuid,
          type: 'access',
          iat: now,
          jti: crypto.randomBytes(16).toString('hex'),
          iss: 'dailyuse-api',
          aud: 'dailyuse-client',
        },
        secret,
        {
          algorithm: 'HS256',
          expiresIn: accessTokenExpiresIn,
        },
      );

      const refreshToken = jwt.sign(
        {
          accountUuid: session.accountUuid,
          type: 'refresh',
          iat: now,
          jti: crypto.randomBytes(16).toString('hex'),
          iss: 'dailyuse-api',
          aud: 'dailyuse-client',
          purpose: 'token-refresh',
        },
        secret,
        {
          algorithm: 'HS256',
          expiresIn: refreshTokenExpiresIn,
        },
      );

      // 4. 更新会话中的 tokens
      session.refreshAccessToken(accessToken);
      session.refreshRefreshToken();

      // 5. 保存会话
      await this.sessionRepository.save(session);

      logger.info('[RefreshToken] Web token refresh successful', {
        sessionUuid: session.uuid,
        accountUuid: session.accountUuid,
      });

      return {
        success: true,
        accessToken,
        refreshToken,
        expiresAt,
        message: 'Token refreshed successfully',
      };
    } catch (error) {
      logger.error('[RefreshToken] Web token refresh failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
