/**
 * Record Pending Change Service
 *
 * 记录待同步变更的应用服务
 */

import {
  PendingChange,
  type IPendingChangeRepository,
} from '@dailyuse/domain-server/sync';
import {
  ChangeOperationType,
  type PendingChangeClientDTO,
  type SyncableEntityType,
  type SyncVersionServerDTO,
} from '@dailyuse/contracts/sync';
import { eventBus } from '@dailyuse/utils';

/**
 * 记录变更的参数
 */
export interface RecordChangeParams {
  entityType: SyncableEntityType;
  entityUuid: string;
  entityName?: string;
  operation: ChangeOperationType;
  beforeData?: unknown;
  afterData?: unknown;
  version: SyncVersionServerDTO;
}

/**
 * Record Pending Change Service
 */
export class RecordPendingChange {
  constructor(private readonly changeRepository: IPendingChangeRepository) {}

  /**
   * 获取服务单例
   */
  static getInstance(): RecordPendingChange {
    if (!RecordPendingChange.instance) {
      RecordPendingChange.instance = RecordPendingChange.createInstance();
    }
    return RecordPendingChange.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    RecordPendingChange.instance = undefined as unknown as RecordPendingChange;
  }

  async execute(accountUuid: string, params: RecordChangeParams): Promise<PendingChangeClientDTO> {
    // 1. 检查是否已有相同实体的未同步变更
    const existingChanges = await this.changeRepository.findUnsyncedByEntityRef(
      accountUuid,
      params.entityType,
      params.entityUuid,
    );

    // 2. 如果有未同步的创建操作，且当前是更新操作，合并
    if (existingChanges.length > 0 && params.operation === 'UPDATE') {
      const createChange = existingChanges.find(
        (c: PendingChange) => c.operation === ChangeOperationType.CREATE
      );
      if (createChange) {
        await this.changeRepository.delete(createChange.uuid);
        const updatedChange = PendingChange.create({
          entityRef: {
            entityType: params.entityType,
            entityUuid: params.entityUuid,
            entityName: params.entityName,
          },
          operation: ChangeOperationType.CREATE,
          beforeData: createChange.beforeData,
          afterData: params.afterData,
          version: params.version,
        });
        await this.changeRepository.save(updatedChange);
        return updatedChange.toClientDTO();
      }
    }

    // 3. 如果有未同步的变更且当前是删除操作
    if (existingChanges.length > 0 && params.operation === 'DELETE') {
      const createChange = existingChanges.find(
        (c: PendingChange) => c.operation === ChangeOperationType.CREATE
      );
      if (createChange) {
        await this.changeRepository.deleteMany(existingChanges.map((c: PendingChange) => c.uuid));
        const deleteChange = PendingChange.create({
          entityRef: {
            entityType: params.entityType,
            entityUuid: params.entityUuid,
            entityName: params.entityName,
          },
          operation: ChangeOperationType.DELETE,
          beforeData: params.beforeData,
          afterData: params.afterData,
          version: params.version,
        });
        deleteChange.markAsSynced('local-cancel');
        return deleteChange.toClientDTO();
      }
    }

    // 4. 创建新的变更记录
    const change = PendingChange.create({
      entityRef: {
        entityType: params.entityType,
        entityUuid: params.entityUuid,
        entityName: params.entityName,
      },
      operation: params.operation,
      beforeData: params.beforeData,
      afterData: params.afterData,
      version: params.version,
    });

    await this.changeRepository.save(change);

    // 5. 发布事件
    await eventBus.emit('sync.change.recorded', {
      changeId: change.uuid,
      entityType: params.entityType,
      entityUuid: params.entityUuid,
      operation: params.operation,
      accountUuid,
    });

    return change.toClientDTO();
  }
}

/**
 * 便捷函数：记录待同步变更
 */
export const recordPendingChange = (accountUuid: string, params: RecordChangeParams): Promise<PendingChangeClientDTO> =>
  RecordPendingChange.getInstance().execute(accountUuid, params);
