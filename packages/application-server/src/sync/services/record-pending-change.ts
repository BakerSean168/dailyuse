/**
 * Record Pending Change Service
 *
 * 记录待同步变更的应用服务
 */

import { PendingChange, type IPendingChangeRepository } from '@dailyuse/domain-server/sync';
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
  entityId: string;
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

  async execute(accountUuid: string, params: RecordChangeParams): Promise<PendingChangeClientDTO> {
    // 1. 检查是否已有相同实体的未同步变更
    const existingChanges = await this.changeRepository.findUnsyncedByEntityRef(
      accountUuid,
      params.entityType,
      params.entityId,
    );

    // 2. 如果有未同步的创建操作，且当前是更新操作，合并
    if (existingChanges.length > 0 && params.operation === ChangeOperationType.Update) {
      const createChange = existingChanges.find(
        (c: PendingChange) => c.operation === ChangeOperationType.Create,
      );
      if (createChange) {
        await this.changeRepository.delete(createChange.id);
        const updatedChange = PendingChange.create({
          entityRef: {
            entityType: params.entityType,
            entityId: params.entityId,
            entityName: params.entityName,
          },
          operation: ChangeOperationType.Create,
          beforeData: createChange.beforeData,
          afterData: params.afterData,
          version: params.version,
        });
        await this.changeRepository.save(updatedChange);
        return updatedChange.toClientDTO();
      }
    }

    // 3. 如果有未同步的变更且当前是删除操作
    if (existingChanges.length > 0 && params.operation === ChangeOperationType.Delete) {
      const createChange = existingChanges.find(
        (c: PendingChange) => c.operation === ChangeOperationType.Create,
      );
      if (createChange) {
        await this.changeRepository.deleteMany(existingChanges.map((c: PendingChange) => c.id));
        const deleteChange = PendingChange.create({
          entityRef: {
            entityType: params.entityType,
            entityId: params.entityId,
            entityName: params.entityName,
          },
          operation: ChangeOperationType.Delete,
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
        entityId: params.entityId,
        entityName: params.entityName,
      },
      operation: params.operation,
      beforeData: params.beforeData,
      afterData: params.afterData,
      version: params.version,
    });

    await this.changeRepository.save(change);

    // 5. 发布事件
    await (eventBus as any).send('sync.change.recorded', {
      changeId: change.id,
      entityType: params.entityType,
      entityId: params.entityId,
      operation: params.operation,
      accountUuid,
    });

    return change.toClientDTO();
  }
}
