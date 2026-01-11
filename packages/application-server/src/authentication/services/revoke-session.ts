/**
 * Revoke Session Service
 *
 * 撤销单个会话应用服务
 */

import type { IAuthSessionRepository } from '@dailyuse/domain-server/authentication';
import type { RevokeSessionRequest } from '@dailyuse/contracts/authentication';
import { eventBus } from '@dailyuse/utils';
import { AuthContainer } from '@dailyuse/infrastructure-server';

/**
 * Revoke Session Service
 */
export class RevokeSession {
  private static instance: RevokeSession;

  private constructor(private readonly sessionRepository: IAuthSessionRepository) {}

  /**
   * 创建服务实例
   */
  static createInstance(sessionRepository?: IAuthSessionRepository): RevokeSession {
    const container = AuthContainer.getInstance();
    const repo = sessionRepository || container.getSessionRepository();
    RevokeSession.instance = new RevokeSession(repo);
    return RevokeSession.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): RevokeSession {
    if (!RevokeSession.instance) {
      RevokeSession.instance = RevokeSession.createInstance();
    }
    return RevokeSession.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    RevokeSession.instance = undefined as unknown as RevokeSession;
  }

  /**
   * 执行撤销会话
   */
  async execute(accountUuid: string, input: RevokeSessionRequest): Promise<void> {
    // 1. 查找会话（使用 sessionId）
    const session = await this.sessionRepository.findByUuid(input.sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // 2. 验证权限
    if (session.accountUuid !== accountUuid) {
      throw new Error('Not authorized to revoke this session');
    }

    // 3. 撤销会话
    session.revoke();

    // 4. 保存会话
    await this.sessionRepository.save(session);

    // 5. 发布事件
    await eventBus.emit('SessionRevoked', {
      sessionUuid: session.uuid,
      accountUuid: session.accountUuid,
    });
  }
}
