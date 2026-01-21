/**
 * Revoke All Sessions Service
 *
 * 撤销所有会话应用服务
 * 
 * 提供两种接口：
 * - execute(): 用于 Desktop 客户端
 * - executeForWeb(): 用于 Web API（通过 accessToken 验证）
 */

import type { IAuthSessionRepository } from '@dailyuse/domain-server/authentication';
import type { RevokeAllSessionsRequest } from '@dailyuse/contracts/authentication';
import { eventBus, createLogger } from '@dailyuse/utils';

const logger = createLogger('RevokeAllSessions');

/**
 * Revoke All Sessions Service
 */
export class RevokeAllSessions {
  constructor(private readonly sessionRepository: IAuthSessionRepository) {}

  /**
   * 执行撤销所有会话
   */
  async execute(accountUuid: string, options?: RevokeAllSessionsRequest & { currentSessionUuid?: string }): Promise<number> {
    // 1. 查找所有会话
    const sessions = await this.sessionRepository.findByAccountUuid(accountUuid);

    // 2. 撤销除当前会话外的所有会话
    let revokedCount = 0;
    for (const session of sessions) {
      if (options?.currentSessionUuid && session.uuid === options.currentSessionUuid) {
        continue; // 跳过当前会话
      }
      if (session.status === 'ACTIVE') {
        session.revoke();
        await this.sessionRepository.save(session);
        revokedCount++;
      }
    }

    // 3. 发布事件
    await eventBus.emit('AllSessionsRevoked', {
      accountUuid,
      revokedCount,
      excludedSessionUuid: options?.currentSessionUuid,
    });

    return revokedCount;
  }

  /**
   * 执行撤销所有会话 (Web API 版本 - 从 apps/api 迁移)
   * 
   * 通过 accessToken 验证并撤销账户的所有会话
   */
  async executeForWeb(params: {
    accountUuid: string;
    accessToken: string;
  }): Promise<{ success: boolean; message: string; revokedSessionsCount: number }> {
    logger.info('[RevokeAllSessions] Starting web logout all', {
      accountUuid: params.accountUuid,
    });

    try {
      // 1. 验证当前会话
      const currentSession = await this.sessionRepository.findByAccessToken(params.accessToken);
      if (!currentSession) {
        throw new Error('Current session not found');
      }

      if (currentSession.accountUuid !== params.accountUuid) {
        throw new Error('Access token does not belong to this account');
      }

      // 2. 查询账户所有活跃会话
      const sessions = await this.sessionRepository.findActiveSessionsByAccountUuid(
        params.accountUuid,
      );

      if (sessions.length === 0) {
        logger.warn('[RevokeAllSessions] No active sessions found', {
          accountUuid: params.accountUuid,
        });
        return {
          success: true,
          message: 'No active sessions to revoke',
          revokedSessionsCount: 0,
        };
      }

      // 3. 批量注销所有会话
      sessions.forEach((session) => {
        session.revoke();
      });

      // 4. 持久化所有会话
      await Promise.all(sessions.map((session) => this.sessionRepository.save(session)));

      logger.info('[RevokeAllSessions] All sessions revoked successfully', {
        accountUuid: params.accountUuid,
        revokedCount: sessions.length,
      });

      // 5. 发布全设备登出事件
      await eventBus.emit('authentication:logout_all', {
        eventType: 'authentication:logout_all',
        payload: {
          accountUuid: params.accountUuid,
          revokedSessionsCount: sessions.length,
        },
        timestamp: Date.now(),
        aggregateId: params.accountUuid,
        occurredOn: new Date(),
      });

      return {
        success: true,
        message: `Successfully logged out from ${sessions.length} device(s)`,
        revokedSessionsCount: sessions.length,
      };
    } catch (error) {
      logger.error('[RevokeAllSessions] Web logout all failed', {
        accountUuid: params.accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
