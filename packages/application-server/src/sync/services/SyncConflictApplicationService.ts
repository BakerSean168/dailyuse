/**
 * SyncConflict Application Service
 *
 * 同步冲突应用服务
 *
 * 职责：
 * - 记录冲突
 * - 查询冲突
 * - 解决冲突
 * - 自动解决冲突
 */

import {
  SyncConflict,
  type ISyncConflictRepository,
} from '@dailyuse/domain-server/sync';
import type {
  SyncConflictClientDTO,
  ConflictListResponse,
  ResolveConflictRequest,
  ConflictResolutionDTO,
  SyncVersionServerDTO,
  SyncableEntityType,
  EntityReferenceDTO,
  ConflictStatus,
} from '@dailyuse/contracts/sync';
import { ConflictResolutionStrategy } from '@dailyuse/contracts/sync';
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
 * SyncConflict Application Service
 */
export class SyncConflictApplicationService {
  constructor(
    private readonly conflictRepository: ISyncConflictRepository,
    private readonly accountUuid: string,
  ) {}

  /**
   * 记录冲突
   */
  async recordConflict(params: CreateConflictParams): Promise<SyncConflictClientDTO> {
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
      accountUuid: this.accountUuid,
    });

    return conflict.toClientDTO();
  }

  /**
   * 批量记录冲突
   */
  async recordConflicts(conflicts: CreateConflictParams[]): Promise<SyncConflictClientDTO[]> {
    const created: SyncConflict[] = [];
    for (const params of conflicts) {
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
      created.push(conflict);
    }

    await this.conflictRepository.saveMany(created);
    return created.map((c) => c.toClientDTO());
  }

  /**
   * 获取冲突详情
   */
  async getConflict(conflictId: string): Promise<SyncConflictClientDTO | null> {
    const conflict = await this.conflictRepository.findByUuid(conflictId);
    return conflict ? conflict.toClientDTO() : null;
  }

  /**
   * 获取会话的所有冲突
   */
  async getSessionConflicts(sessionId: string): Promise<ConflictListResponse> {
    const conflicts = await this.conflictRepository.findBySessionId(sessionId);
    return {
      conflicts: conflicts.map((c: SyncConflict) => c.toClientDTO()),
      total: conflicts.length,
    };
  }

  /**
   * 获取未解决的冲突
   */
  async getUnresolvedConflicts(sessionId?: string): Promise<ConflictListResponse> {
    const conflicts = await this.conflictRepository.findUnresolved(sessionId);
    return {
      conflicts: conflicts.map((c: SyncConflict) => c.toClientDTO()),
      total: conflicts.length,
    };
  }

  /**
   * 解决冲突
   */
  async resolveConflict(request: ResolveConflictRequest): Promise<SyncConflictClientDTO> {
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
      accountUuid: this.accountUuid,
    });

    return conflict.toClientDTO();
  }

  /**
   * 批量解决冲突
   */
  async resolveConflicts(
    requests: ResolveConflictRequest[],
  ): Promise<SyncConflictClientDTO[]> {
    const results: SyncConflictClientDTO[] = [];
    for (const request of requests) {
      const result = await this.resolveConflict(request);
      results.push(result);
    }
    return results;
  }

  /**
   * 忽略冲突
   */
  async ignoreConflict(conflictId: string): Promise<SyncConflictClientDTO> {
    const conflict = await this.conflictRepository.findByUuid(conflictId);
    if (!conflict) {
      throw new Error(`冲突不存在: ${conflictId}`);
    }

    conflict.ignore();
    await this.conflictRepository.save(conflict);

    await eventBus.emit('sync.conflict.ignored', {
      conflictId: conflict.uuid,
      sessionId: conflict.sessionId,
      accountUuid: this.accountUuid,
    });

    return conflict.toClientDTO();
  }

  /**
   * 自动解决可自动解决的冲突
   */
  async autoResolveConflicts(sessionId: string): Promise<SyncConflictClientDTO[]> {
    const autoResolvable = await this.conflictRepository.findAutoResolvable(sessionId);
    const resolved: SyncConflictClientDTO[] = [];

    for (const conflict of autoResolvable) {
      // 根据冲突类型自动选择解决策略
      const resolution = this.determineAutoResolution(conflict);
      conflict.resolve(resolution);
      await this.conflictRepository.save(conflict);
      resolved.push(conflict.toClientDTO());
    }

    if (resolved.length > 0) {
      await eventBus.emit('sync.conflicts.auto-resolved', {
        sessionId,
        count: resolved.length,
        accountUuid: this.accountUuid,
      });
    }

    return resolved;
  }

  /**
   * 获取未解决冲突数量
   */
  async getUnresolvedCount(sessionId?: string): Promise<number> {
    const conflicts = await this.conflictRepository.findUnresolved(sessionId);
    return conflicts.length;
  }

  /**
   * 检查会话是否有未解决冲突
   */
  async hasUnresolvedConflicts(sessionId: string): Promise<boolean> {
    const count = await this.getUnresolvedCount(sessionId);
    return count > 0;
  }

  /**
   * 删除会话的所有冲突
   */
  async deleteSessionConflicts(sessionId: string): Promise<number> {
    return this.conflictRepository.deleteBySessionId(sessionId);
  }

  /**
   * 确定自动解决策略
   */
  private determineAutoResolution(conflict: SyncConflict): ConflictResolutionDTO {
    // 基于最后修改时间的简单策略：较新的版本获胜
    const localTime = conflict.localVersion.lastModifiedAt;
    const remoteTime = conflict.remoteVersion.lastModifiedAt;

    if (localTime > remoteTime) {
      return {
        strategy: ConflictResolutionStrategy.LOCAL_WINS,
        selectedVersion: 'local',
        resolvedData: conflict.localData,
        resolvedBy: 'auto',
        resolvedAt: Date.now(),
      };
    } else {
      return {
        strategy: ConflictResolutionStrategy.REMOTE_WINS,
        selectedVersion: 'remote',
        resolvedData: conflict.remoteData,
        resolvedBy: 'auto',
        resolvedAt: Date.now(),
      };
    }
  }
}
