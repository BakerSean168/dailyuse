/**
 * Resolve Sync Conflict Service
 *
 * 解决同步冲突的应用服务
 */

import type {
  ResolveConflictRequest,
  SyncConflictClientDTO,
} from '@dailyuse/contracts/sync';
import type { ISyncConflictRepository } from '@dailyuse/domain-server/sync';
import { eventBus } from '@dailyuse/utils';

/**
 * Resolve Sync Conflict Service
 */
export class ResolveSyncConflict {
  constructor(private readonly conflictRepository: ISyncConflictRepository) {}

  /**
   * 获取服务单例
   */
  static getInstance(): ResolveSyncConflict {
    if (!ResolveSyncConflict.instance) {
      ResolveSyncConflict.instance = ResolveSyncConflict.createInstance();
    }
    return ResolveSyncConflict.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ResolveSyncConflict.instance = undefined as unknown as ResolveSyncConflict;
  }

  async execute(accountUuid: string, request: ResolveConflictRequest): Promise<SyncConflictClientDTO> {
    const conflict = await this.conflictRepository.findByUuid(request.conflictId);
    if (!conflict) {
      throw new Error(`冲突不存在: ${request.conflictId}`);
    }

    if (conflict.isResolved) {
      throw new Error('冲突已解决');
    }

    conflict.resolve(request.resolution);
    await this.conflictRepository.save(conflict);

    await eventBus.emit('sync.conflict.resolved', {
      conflictId: conflict.uuid,
      sessionId: conflict.sessionId,
      resolution: request.resolution,
      accountUuid,
    });

    return conflict.toClientDTO();
  }
}

/**
 * 便捷函数：解决同步冲突
 */
export const resolveSyncConflict = (accountUuid: string, request: ResolveConflictRequest): Promise<SyncConflictClientDTO> =>
  ResolveSyncConflict.getInstance().execute(accountUuid, request);
