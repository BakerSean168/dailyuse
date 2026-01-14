/**
 * PendingChange Application Service
 *
 * 待同步变更应用服务
 *
 * 职责：
 * - 记录本地变更
 * - 查询待同步变更
 * - 标记变更为已同步
 * - 清理已同步变更
 */

import {
  PendingChange,
  type IPendingChangeRepository,
} from '@dailyuse/domain-server/sync';
import {
  ChangeOperationType,
  type PendingChangeClientDTO,
  type PendingChangesRequest,
  type PendingChangesResponse,
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
 * PendingChange Application Service
 */
export class PendingChangeApplicationService {
  constructor(
    private readonly changeRepository: IPendingChangeRepository,
    private readonly accountUuid: string,
  ) {}

  /**
   * 记录本地变更
   */
  async recordChange(params: RecordChangeParams): Promise<PendingChangeClientDTO> {
    // 1. 检查是否已有相同实体的未同步变更
    const existingChanges = await this.changeRepository.findUnsyncedByEntityRef(
      params.entityType,
      params.entityUuid,
    );

    // 2. 如果有未同步的创建操作，且当前是更新操作，合并
    if (existingChanges.length > 0 && params.operation === 'UPDATE') {
      const createChange = existingChanges.find(
        (c: PendingChange) => c.operation === ChangeOperationType.CREATE
      );
      if (createChange) {
        // 创建后又更新，我们不能直接更新 afterData（实体是不可变的）
        // 需要删除旧的并创建新的变更记录
        await this.changeRepository.delete(createChange.uuid);
        const updatedChange = PendingChange.create({
          entityRef: {
            entityType: params.entityType,
            entityUuid: params.entityUuid,
            entityName: params.entityName,
          },
          operation: ChangeOperationType.CREATE, // 保持为 CREATE
          beforeData: createChange.beforeData,
          afterData: params.afterData, // 使用新的 afterData
          version: params.version,
        });
        await this.changeRepository.save(updatedChange);
        return updatedChange.toClientDTO();
      }
    }

    // 3. 如果有未同步的变更且当前是删除操作，可以移除之前的变更
    if (existingChanges.length > 0 && params.operation === 'DELETE') {
      const createChange = existingChanges.find(
        (c: PendingChange) => c.operation === ChangeOperationType.CREATE
      );
      if (createChange) {
        // 创建后又删除，直接移除创建记录
        await this.changeRepository.deleteMany(existingChanges.map((c: PendingChange) => c.uuid));
        // 返回一个空的变更表示已处理
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
      accountUuid: this.accountUuid,
    });

    return change.toClientDTO();
  }

  /**
   * 批量记录变更
   */
  async recordChanges(changes: RecordChangeParams[]): Promise<PendingChangeClientDTO[]> {
    const results: PendingChangeClientDTO[] = [];
    for (const params of changes) {
      const result = await this.recordChange(params);
      results.push(result);
    }
    return results;
  }

  /**
   * 获取待同步变更列表
   */
  async getPendingChanges(request: PendingChangesRequest): Promise<PendingChangesResponse> {
    const page = request.page ?? 1;
    const pageSize = request.pageSize ?? 50;
    const offset = (page - 1) * pageSize;

    const changes = await this.changeRepository.findByQuery({
      entityType: request.entityType,
      isSynced: false,
      limit: pageSize,
      offset,
    });

    const total = await this.changeRepository.count({
      entityType: request.entityType,
      isSynced: false,
    });

    // 按类型统计
    const allUnsynced = await this.changeRepository.findAllUnsynced();
    const byType: Record<string, number> = {};
    for (const change of allUnsynced) {
      const type = change.entityRef.entityType;
      byType[type] = (byType[type] ?? 0) + 1;
    }

    const hasMore = offset + changes.length < total;

    return {
      changes: changes.map((c: PendingChange) => c.toClientDTO()),
      total,
      page,
      pageSize,
      hasMore,
      byType,
    };
  }

  /**
   * 获取所有未同步变更
   */
  async getAllUnsyncedChanges(limit?: number): Promise<PendingChangeClientDTO[]> {
    const changes = await this.changeRepository.findAllUnsynced(limit);
    return changes.map((c: PendingChange) => c.toClientDTO());
  }

  /**
   * 获取指定实体的未同步变更
   */
  async getUnsyncedByEntity(
    entityType: SyncableEntityType,
    entityUuid: string,
  ): Promise<PendingChangeClientDTO[]> {
    const changes = await this.changeRepository.findUnsyncedByEntityRef(entityType, entityUuid);
    return changes.map((c: PendingChange) => c.toClientDTO());
  }

  /**
   * 标记变更为已同步
   */
  async markAsSynced(changeId: string, sessionId: string): Promise<void> {
    const change = await this.changeRepository.findByUuid(changeId);
    if (!change) {
      throw new Error(`变更不存在: ${changeId}`);
    }

    change.markAsSynced(sessionId);
    await this.changeRepository.save(change);
  }

  /**
   * 批量标记变更为已同步
   */
  async markManyAsSynced(changeIds: string[], sessionId: string): Promise<void> {
    for (const changeId of changeIds) {
      await this.markAsSynced(changeId, sessionId);
    }
  }

  /**
   * 清理已同步的变更
   */
  async cleanupSyncedChanges(): Promise<number> {
    const deletedCount = await this.changeRepository.deleteSynced();
    
    await eventBus.emit('sync.changes.cleaned', {
      accountUuid: this.accountUuid,
      deletedCount,
    });

    return deletedCount;
  }

  /**
   * 获取待同步变更数量
   */
  async getPendingCount(): Promise<number> {
    return this.changeRepository.count({ isSynced: false });
  }

  /**
   * 检查是否有待同步变更
   */
  async hasPendingChanges(): Promise<boolean> {
    const count = await this.getPendingCount();
    return count > 0;
  }
}
