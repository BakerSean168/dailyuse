/**
 * Record Sync Conflict Service
 *
 * 记录同步冲突的应用服务
 */

import {
  SyncConflict,
  type ISyncConflictRepository,
} from '@dailyuse/domain-server/sync';
import type {
  SyncConflictClientDTO,
  SyncVersionServerDTO,
  EntityReferenceDTO,
} from '@dailyuse/contracts/sync';
import { eventBus } from '@dailyuse/utils';

type ConflictType = 'update-update' | 'update-delete' | 'delete-update';

/**
 * 创建冲突的参数
 */
export interface CreateConflictParams {
  sessionId: string;
  entityRef: EntityReferenceDTO;
  conflictType: ConflictType;
  localVersion: SyncVersionServerDTO;
  localData: unknown;
  remoteVersion: SyncVersionServerDTO;
  remoteData: unknown;
}

/**
 * Record Sync Conflict Service
 */
export class RecordSyncConflict {
  constructor(private readonly conflictRepository: ISyncConflictRepository) {}

  /**
   * 获取服务单例
   */
  static getInstance(): RecordSyncConflict {
    if (!RecordSyncConflict.instance) {
      RecordSyncConflict.instance = RecordSyncConflict.createInstance();
    }
    return RecordSyncConflict.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    RecordSyncConflict.instance = undefined as unknown as RecordSyncConflict;
  }

  async execute(accountUuid: string, params: CreateConflictParams): Promise<SyncConflictClientDTO> {
    const conflict = SyncConflict.create({
      uuid: crypto.randomUUID(),
      sessionId: params.sessionId,
      entityRef: params.entityRef,
      conflictType: params.conflictType,
      localVersion: params.localVersion,
      localData: params.localData,
      remoteVersion: params.remoteVersion,
      remoteData: params.remoteData,
    });

    await this.conflictRepository.save(conflict);

    await eventBus.emit('sync.conflict.detected', {
      conflictId: conflict.uuid,
      sessionId: params.sessionId,
      entityType: params.entityRef.entityType,
      entityUuid: params.entityRef.entityUuid,
      conflictType: params.conflictType,
      accountUuid,
    });

    return conflict.toClientDTO();
  }
}

/**
 * 便捷函数：记录同步冲突
 */
export const recordSyncConflict = (accountUuid: string, params: CreateConflictParams): Promise<SyncConflictClientDTO> =>
  RecordSyncConflict.getInstance().execute(accountUuid, params);
