/**
 * Logout Service
 *
 * 用户登出应用服务
 */

import type { IAuthSessionRepository } from '@/domain-server';
import type { LogoutReq, LogoutRes } from '@dailyuse/contracts/authentication';
import type { Context } from '@dailyuse/contracts/shared';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('Logout');

/**
 * Logout Service
 */
export class Logout {
  constructor(private readonly sessionRepository: IAuthSessionRepository) {}

  /**
   * 执行登出（登出当前会话）
   */
  async execute(input: LogoutReq, cx: Context): Promise<LogoutRes> {
    logger.info('[Logout] Starting logout', { identityId: cx.identityId });

    try {
      // 1. 查找当前用户的所有活跃会�?
      const sessions = await this.sessionRepository.findByIdentityId(IdentityId.of(cx.identityId));

      // 2. 撤销所有会话（领域事件在内部创建）
      for (const session of sessions) {
        if (session.isValid()) {
          session.revoke();
          await this.sessionRepository.save(session); // 仓储层自动发送领域事�?
        }
      }

      logger.info('[Logout] Logout successful', {
        identityId: cx.identityId,
        revokedSessions: sessions.length
      });
    } catch (error) {
      logger.error('[Logout] Logout failed', {
        identityId: cx.identityId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}
