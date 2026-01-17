/**
 * Logout Service
 *
 * 用户登出应用服务
 * 
 * 提供两种接口：
 * - execute(): 用于 Desktop 客户端
 * - executeForWeb(): 用于 Web API（通过 accessToken 登出）
 */

import type { IAuthSessionRepository } from '@dailyuse/domain-server/authentication';
import type { LogoutRequest } from '@dailyuse/contracts/authentication';
import { eventBus, createLogger } from '@dailyuse/utils';
import { AuthContainer } from '@dailyuse/infrastructure-server';

const logger = createLogger('Logout');

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

  /**
   * 执行登出 (Web API 版本 - 从 apps/api 迁移)
   * 
   * 通过 accessToken 查询会话并登出
   */
  async executeForWeb(params: { accessToken: string }): Promise<{ success: boolean; message: string }> {
    logger.info('[Logout] Starting web logout', {
      accessToken: params.accessToken.substring(0, 20) + '...',
    });

    try {
      // 查询会话
      const session = await this.sessionRepository.findByAccessToken(params.accessToken);
      if (!session) {
        throw new Error('Session not found or already logged out');
      }

      // 检查会话状态
      if (session.status === 'REVOKED') {
        logger.warn('[Logout] Session already revoked', {
          sessionUuid: session.uuid,
        });
        return {
          success: true,
          message: 'Already logged out',
        };
      }

      // 注销会话
      session.revoke();

      // 持久化会话
      await this.sessionRepository.save(session);

      logger.info('[Logout] Session revoked successfully', {
        sessionUuid: session.uuid,
        accountUuid: session.accountUuid,
      });

      // 发布登出事件
      await eventBus.emit('authentication:logout', {
        eventType: 'authentication:logout',
        payload: {
          accountUuid: session.accountUuid,
          sessionUuid: session.uuid,
          deviceType: session.device.deviceType,
          ipAddress: session.ipAddress,
          revokedAt: session.revokedAt,
        },
        timestamp: Date.now(),
        aggregateId: session.accountUuid,
        occurredOn: new Date(),
      });

      return {
        success: true,
        message: 'Logout successful',
      };
    } catch (error) {
      logger.error('[Logout] Web logout failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
