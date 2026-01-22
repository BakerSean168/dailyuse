/**
 * Get Sync Session Service
 *
 * 获取同步会话的应用服务
 */

import type { SyncSessionClientDTO } from '@dailyuse/contracts/sync';
import type { ISyncSessionRepository } from '@dailyuse/domain-server/sync';

/**
 * Get Sync Session Service
 */
export class GetSyncSession {
  constructor(private readonly sessionRepository: ISyncSessionRepository) {}

  async execute(sessionId: string): Promise<SyncSessionClientDTO | null> {
    const session = await this.sessionRepository.findByUuid(sessionId);
    return session ? session.toClientDTO() : null;
  }
}
