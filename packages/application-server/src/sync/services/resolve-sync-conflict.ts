/**
 * Resolve Sync Conflict Service
 *
 * 解决同步冲突的应用服务
 */

import type {
  ResolveSyncConflictReq,
  SyncConflictClientDTO,
  ConflictResolutionDTO,
} from '@dailyuse/contracts/sync';
import { ConflictResolutionStrategy } from '@dailyuse/contracts/sync';
import type { ISyncConflictRepository } from '@dailyuse/domain-server/sync';
import { eventBus } from '@dailyuse/utils';

/**
 * Resolve Sync Conflict Service
 */
export class ResolveSyncConflict {
  constructor(private readonly conflictRepository: ISyncConflictRepository) {}

  async execute(
    accountUuid: string,
    request: ResolveSyncConflictReq,
  ): Promise<SyncConflictClientDTO> {
    const conflict = await this.conflictRepository.findByUuid(request.conflictId);
    if (!conflict) {
      throw new Error(`冲突不存在: ${request.conflictId}`);
    }

    if (conflict.isResolved) {
      throw new Error('冲突已解决');
    }

    // Map resolution string to ConflictResolutionDTO
    const selectedVersion = request.resolution === 'USE_LOCAL' ? 'local' as const
      : request.resolution === 'USE_REMOTE' ? 'remote' as const
      : 'merged' as const;

    const resolvedData = request.resolution === 'USE_LOCAL' ? conflict.localData
      : request.resolution === 'USE_REMOTE' ? conflict.remoteData
      : request.customData;

    const resolutionDTO: ConflictResolutionDTO = {
      strategy: request.resolution === 'USE_LOCAL' ? ConflictResolutionStrategy.UseLocal
        : request.resolution === 'USE_REMOTE' ? ConflictResolutionStrategy.UseRemote
        : ConflictResolutionStrategy.Merge,
      selectedVersion,
      resolvedData,
      resolvedAt: Date.now(),
      resolvedBy: accountUuid,
    };

    conflict.resolve(resolutionDTO);
    await this.conflictRepository.save(conflict);

    await (eventBus as any).send('sync.conflict.resolved', {
      conflictId: conflict.id,
      sessionId: conflict.sessionId,
      resolution: resolutionDTO,
      accountUuid,
    });

    return conflict.toClientDTO();
  }
}
