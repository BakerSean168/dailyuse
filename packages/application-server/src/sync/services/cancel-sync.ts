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

  async execute(
    accountUuid: string,
    sessionId: string,
    reason?: string,
  ): Promise<SyncSessionClientDTO> {
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
