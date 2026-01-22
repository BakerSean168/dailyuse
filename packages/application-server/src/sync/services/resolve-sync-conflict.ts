/**
 * Resolve Sync Conflict Service
 *
 * 解决同步冲突的应用服务
 */

import type { ResolveConflictRequest, SyncConflictClientDTO } from '@dailyuse/contracts/sync';
import type { ISyncConflictRepository } from '@dailyuse/domain-server/sync';
import { eventBus } from '@dailyuse/utils';

/**
 * Resolve Sync Conflict Service
 */
export class ResolveSyncConflict {
  constructor(private readonly conflictRepository: ISyncConflictRepository) {}

  async execute(
    accountUuid: string,
    request: ResolveConflictRequest,
  ): Promise<SyncConflictClientDTO> {
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
