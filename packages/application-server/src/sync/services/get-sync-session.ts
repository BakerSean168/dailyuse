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

  /**
   * 获取服务单例
   */
  static getInstance(): GetSyncSession {
    if (!GetSyncSession.instance) {
      GetSyncSession.instance = GetSyncSession.createInstance();
    }
    return GetSyncSession.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetSyncSession.instance = undefined as unknown as GetSyncSession;
  }

  async execute(sessionId: string): Promise<SyncSessionClientDTO | null> {
    const session = await this.sessionRepository.findByUuid(sessionId);
    return session ? session.toClientDTO() : null;
  }
}

/**
 * 便捷函数：获取同步会话
 */
export const getSyncSession = (sessionId: string): Promise<SyncSessionClientDTO | null> =>
  GetSyncSession.getInstance().execute(sessionId);
