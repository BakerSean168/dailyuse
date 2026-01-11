/**
 * Logout Service
 *
 * 用户登出应用服务
 */

import type { IAuthSessionRepository } from '@dailyuse/domain-server/authentication';
import type { LogoutRequest } from '@dailyuse/contracts/authentication';
import { eventBus } from '@dailyuse/utils';
import { AuthContainer } from '@dailyuse/infrastructure-server';

/**
 * Logout Service
 */
export class Logout {
  private static instance: Logout;

  private constructor(private readonly sessionRepository: IAuthSessionRepository) {}

  /**
   * 创建服务实例
   */
  static createInstance(sessionRepository?: IAuthSessionRepository): Logout {
    const container = AuthContainer.getInstance();
    const repo = sessionRepository || container.getSessionRepository();
    Logout.instance = new Logout(repo);
    return Logout.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): Logout {
    if (!Logout.instance) {
      Logout.instance = Logout.createInstance();
    }
    return Logout.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    Logout.instance = undefined as unknown as Logout;
  }

  /**
   * 执行登出
   */
  async execute(accountUuid: string, input: LogoutRequest): Promise<void> {
    // 1. 如果登出所有会话
    if (input.allSessions) {
      const sessions = await this.sessionRepository.findByAccountUuid(accountUuid);
      for (const session of sessions) {
        if (session.status === 'ACTIVE') {
          session.revoke();
          await this.sessionRepository.save(session);

          const events = session.getUncommittedDomainEvents();
          for (const event of events) {
            await eventBus.emit(event.eventType, event);
          }
        }
      }
      return;
    }

    // 2. 登出指定会话
    if (input.sessionId) {
      const session = await this.sessionRepository.findByUuid(input.sessionId);
      if (!session) {
        return; // 会话不存在也视为成功登出
      }

      session.revoke();
      await this.sessionRepository.save(session);

      const events = session.getUncommittedDomainEvents();
      for (const event of events) {
        await eventBus.emit(event.eventType, event);
      }
    }
  }
}
