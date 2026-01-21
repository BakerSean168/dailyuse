/**
 * Cancel Sync Service
 *
 * 取消同步会话的应用服务
 */

import type { SyncSessionClientDTO } from '@dailyuse/contracts/sync';
import type { ISyncSessionRepository } from '@dailyuse/domain-server/sync';
import { eventBus } from '@dailyuse/utils';

/**
 * Cancel Sync Service
 */
export class CancelSync {
  constructor(private readonly sessionRepository: ISyncSessionRepository) {}

  /**
   * 获取服务单例
   */
  static getInstance(): CancelSync {
    if (!CancelSync.instance) {
      CancelSync.instance = CancelSync.createInstance();
    }
    return CancelSync.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CancelSync.instance = undefined as unknown as CancelSync;
  }

  async execute(accountUuid: string, sessionId: string, reason?: string): Promise<SyncSessionClientDTO> {
    const session = await this.sessionRepository.findByUuid(sessionId);
    if (!session) {
      throw new Error(`同步会话不存在: ${sessionId}`);
    }

    if (session.isFinished) {
      throw new Error('同步会话已结束，无法取消');
    }

    session.cancel();
    await this.sessionRepository.save(session);

    await eventBus.emit('sync.session.cancelled', {
      sessionId,
      accountUuid,
      reason,
    });

    return session.toClientDTO();
  }
}

/**
 * 便捷函数：取消同步
 */
export const cancelSync = (accountUuid: string, sessionId: string, reason?: string): Promise<SyncSessionClientDTO> =>
  CancelSync.getInstance().execute(accountUuid, sessionId, reason);
