/**
 * Revoke All Sessions Service
 *
 * 撤销所有会话应用服务
 */

import type { IAuthSessionRepository } from '@dailyuse/domain-server/authentication';
import type { RevokeAllSessionsRequest } from '@dailyuse/contracts/authentication';
import { eventBus } from '@dailyuse/utils';
import { AuthContainer } from '@dailyuse/infrastructure-server';

/**
 * Revoke All Sessions Service
 */
export class RevokeAllSessions {
  private static instance: RevokeAllSessions;

  private constructor(private readonly sessionRepository: IAuthSessionRepository) {}

  /**
   * 创建服务实例
   */
  static createInstance(sessionRepository?: IAuthSessionRepository): RevokeAllSessions {
    const container = AuthContainer.getInstance();
    const repo = sessionRepository || container.getSessionRepository();
    RevokeAllSessions.instance = new RevokeAllSessions(repo);
    return RevokeAllSessions.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): RevokeAllSessions {
    if (!RevokeAllSessions.instance) {
      RevokeAllSessions.instance = RevokeAllSessions.createInstance();
    }
    return RevokeAllSessions.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    RevokeAllSessions.instance = undefined as unknown as RevokeAllSessions;
  }

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
}
