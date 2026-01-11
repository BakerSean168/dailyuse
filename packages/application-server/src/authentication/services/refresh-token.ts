/**
 * Refresh Token Service
 *
 * 刷新访问令牌应用服务
 */

import type { IAuthSessionRepository } from '@dailyuse/domain-server/authentication';
import type { RefreshTokenRequest, AuthTokens } from '@dailyuse/contracts/authentication';
import { AuthContainer } from '@dailyuse/infrastructure-server';

/**
 * Refresh Token Service
 */
export class RefreshToken {
  private static instance: RefreshToken;

  private constructor(private readonly sessionRepository: IAuthSessionRepository) {}

  /**
   * 创建服务实例
   */
  static createInstance(sessionRepository?: IAuthSessionRepository): RefreshToken {
    const container = AuthContainer.getInstance();
    const repo = sessionRepository || container.getSessionRepository();
    RefreshToken.instance = new RefreshToken(repo);
    return RefreshToken.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): RefreshToken {
    if (!RefreshToken.instance) {
      RefreshToken.instance = RefreshToken.createInstance();
    }
    return RefreshToken.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    RefreshToken.instance = undefined as unknown as RefreshToken;
  }

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
}
