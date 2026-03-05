/**
 * Refresh Token Service
 *
 * 刷新访问令牌应用服务
 */

import type { IAuthSessionRepository } from '@/domain-server';
import type { IAuthIdentityRepository } from '@/domain-server';
import type { RefreshTokenReq, RefreshTokenRes } from '@dailyuse/contracts/authentication';
import type { Context } from '@dailyuse/contracts/shared';
import type { ITokenProvider } from '@/domain-server/services/token-provider.interface';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('RefreshToken');

/**
 * Refresh Token Service
 */
export class RefreshToken {
  constructor(
    private readonly sessionRepository: IAuthSessionRepository,
    private readonly identityRepository: IAuthIdentityRepository,
    private readonly tokenProvider: ITokenProvider,
  ) {}

  /**
   * 执行令牌刷新
   */
  async execute(input: RefreshTokenReq, cx: Context): Promise<RefreshTokenRes> {
    logger.info('[RefreshToken] Starting token refresh', { identityId: cx.identityId });

    try {
      // 1. 验证 refresh token 并解析 payload
      const verifyResult = this.tokenProvider.verifyRefreshToken(input.refreshToken);
      if (!verifyResult.ok) {
        throw new Error(verifyResult.error.message || 'Invalid or expired refresh token');
      }

      const { identityId: tokenIdentityId, sessionId: tokenSessionId } = verifyResult.data;

      // 2. 根据 payload 查找并校验会话
      const session = await this.sessionRepository.findById(tokenSessionId as any);
      const refreshTokenHash = this.tokenProvider.hash(input.refreshToken);

      if (!session || !session.isValid() || session.refreshTokenHash !== refreshTokenHash) {
        throw new Error('Invalid refresh token or session expired');
      }

      if (String(session.identityId) !== String(tokenIdentityId)) {
        throw new Error('Refresh token does not match session identity');
      }

      // 3. 更新会话活跃时间（滑动窗口）
      session.touch();

      // 4. 生成新的 token pair
      const tokens = this.tokenProvider.generateAuthTokens({
        identityId: session.identityId,
        sessionId: session.id
      });

      // 5. 更新会话中的 refresh token 哈希
      session.updateRefreshTokenHash(this.tokenProvider.hash(tokens.refreshToken));

      // 6. 保存会话（仓储层自动发送领域事件）
      await this.sessionRepository.save(session);

      // 7. 查询身份信息
      const identity = await this.identityRepository.findById(session.identityId);
      if (!identity) {
        throw new Error('Identity not found');
      }

      logger.info('[RefreshToken] Token refresh successful', {
        identityId: tokenIdentityId,
        sessionId: session.id
      });

      // 8. 返回 AuthResponse
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        identity: identity.toClientDTO(),
        session: session.toClientDTO(true)
      };
    } catch (error) {
      logger.error('[RefreshToken] Token refresh failed', {
        identityId: cx.identityId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}
