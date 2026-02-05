/**
 * PendingChange 实体
 * 待同步的本地变更记录
 */

import { Entity, generateUUID } from '@dailyuse/utils';
import {
  ChangeOperationType,
  type PendingChangeServerDTO,
  type PendingChangeClientDTO,
  type PendingChangePersistenceDTO,
  type EntityReferenceDTO,
  type SyncVersionServerDTO,
} from '@dailyuse/contracts/sync';
import { SyncVersion } from '../value-objects/SyncVersion';

/**
 * PendingChange 实体
 *
 * 记录本地尚未同步到远程的变更
 */
export class PendingChange extends Entity<string> {
  private _entityRef: EntityReferenceDTO;
  private _operation: ChangeOperationType;
  private _beforeData?: unknown | null;
  private _afterData?: unknown | null;
  private _version: SyncVersion;
  private _isSynced: boolean;
  private _syncedInSessionId?: string | null;
  private _createdAt: Date;
  private _syncedAt?: Date | null;

  private constructor(params: {
    id: string;
    entityRef: EntityReferenceDTO;
    operation: ChangeOperationType;
    beforeData?: unknown | null;
    afterData?: unknown | null;
    version: SyncVersionServerDTO;
    isSynced: boolean;
    syncedInSessionId?: string | null;
    createdAt: Date;
    syncedAt?: Date | null;
  }) {
    super(params.id);
    this._entityRef = params.entityRef;
    this._operation = params.operation;
    this._beforeData = params.beforeData;
    this._afterData = params.afterData;
    this._version = SyncVersion.fromServerDTO(params.version);
    this._isSynced = params.isSynced;
    this._syncedInSessionId = params.syncedInSessionId;
    this._createdAt = params.createdAt;
    this._syncedAt = params.syncedAt;
  }

  // ===== Getters =====

  get entityRef(): EntityReferenceDTO {
    return this._entityRef;
  }

  get operation(): ChangeOperationType {
    return this._operation;
  }

  get beforeData(): unknown | null | undefined {
    return this._beforeData;
  }

  get afterData(): unknown | null | undefined {
    return this._afterData;
  }

  get version(): SyncVersionServerDTO {
    return this._version.toServerDTO();
  }

  get isSynced(): boolean {
    return this._isSynced;
  }

  get syncedInSessionId(): string | null | undefined {
    return this._syncedInSessionId;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get syncedAt(): Date | null | undefined {
    return this._syncedAt;
  }

  // ===== 静态工厂方法 =====

  /**
   * 创建新的待同步变更
   */
  static create(params: {
    entityRef: EntityReferenceDTO;
    operation: ChangeOperationType;
    beforeData?: unknown;
    afterData?: unknown;
    version: SyncVersionServerDTO;
  }): PendingChange {
    return new PendingChange({
      id: generateUUID(),
      entityRef: params.entityRef,
      operation: params.operation,
      beforeData: params.beforeData,
      afterData: params.afterData,
      version: params.version,
      isSynced: false,
      createdAt: new Date(),
    });
  }

  /**
   * 从 ServerDTO 重建
   */
  static fromServerDTO(dto: PendingChangeServerDTO): PendingChange {
    return new PendingChange({
      id: dto.id,
      entityRef: dto.entityRef,
      operation: dto.operation,
      beforeData: dto.beforeData,
      afterData: dto.afterData,
      version: dto.version,
      isSynced: dto.isSynced,
      syncedInSessionId: dto.syncedInSessionId,
      createdAt: new Date(dto.createdAt),
      syncedAt: dto.syncedAt != null ? new Date(dto.syncedAt) : null,
    });
  }

  /**
   * 从 PersistenceDTO 重建
   */
  static fromPersistenceDTO(dto: PendingChangePersistenceDTO): PendingChange {
    return new PendingChange({
      id: dto.id,
      entityRef: {
        entityType: dto.entityType as any,
        entityId: dto.entityId,
        entityName: dto.entityName ?? undefined,
      },
      operation: dto.operation as ChangeOperationType,
      beforeData: dto.beforeDataJson ? JSON.parse(dto.beforeDataJson) : null,
      afterData: dto.afterDataJson ? JSON.parse(dto.afterDataJson) : null,
      version: JSON.parse(dto.versionJson),
      isSynced: dto.isSynced,
      syncedInSessionId: dto.syncedInSessionId,
      createdAt: new Date(dto.createdAt),
      syncedAt: dto.syncedAt != null ? new Date(dto.syncedAt) : null,
    });
  }

  // ===== 业务方法 =====

  /**
   * 标记为已同步
   */
  markAsSynced(sessionId: string): void {
    this._isSynced = true;
    this._syncedInSessionId = sessionId;
    this._syncedAt = new Date();
  }

  /**
   * 是否为创建操作
   */
  get isCreate(): boolean {
    return this._operation === ChangeOperationType.Create;
  }

  /**
   * 是否为更新操作
   */
  get isUpdate(): boolean {
    return this._operation === ChangeOperationType.Update;
  }

  /**
   * 是否为删除操作
   */
  get isDelete(): boolean {
    return this._operation === ChangeOperationType.Delete;
  }

  // ===== DTO 转换 =====

  toServerDTO(): PendingChangeServerDTO {
    return {
      id: this.id,
      entityRef: this._entityRef,
      operation: this._operation,
      beforeData: this._beforeData ?? null,
      afterData: this._afterData ?? null,
      version: this._version.toServerDTO(),
      isSynced: this._isSynced,
      syncedInSessionId: this._syncedInSessionId ?? null,
      createdAt: this._createdAt.getTime(),
      syncedAt: this._syncedAt?.getTime() ?? null,
    };
  }

  toClientDTO(): PendingChangeClientDTO {
    return {
      id: this.id,
      entityRef: this._entityRef,
      operation: this._operation,
      summary: this._generateSummary(),
      isSynced: this._isSynced,
      createdAt: this._createdAt.getTime(),
      syncedAt: this._syncedAt?.getTime() ?? null,
    };
  }

  /**
   * 生成变更摘要
   */
  private _generateSummary(): string {
    const operationText: Record<ChangeOperationType, string> = {
      [ChangeOperationType.Create]: '创建',
      [ChangeOperationType.Update]: '更新',
      [ChangeOperationType.Delete]: '删除',
      [ChangeOperationType.Restore]: '恢复',
    };
    const entityName = this._entityRef.entityName ?? this._entityRef.entityId.substring(0, 8);
    return `${operationText[this._operation]} ${this._entityRef.entityType}: ${entityName}`;
  }

  toPersistenceDTO(): PendingChangePersistenceDTO {
    return {
      id: this.id,
      entityType: this._entityRef.entityType,
      entityId: this._entityRef.entityId,
      entityName: this._entityRef.entityName ?? null,
      operation: this._operation,
      beforeDataJson: this._beforeData ? JSON.stringify(this._beforeData) : null,
      afterDataJson: this._afterData ? JSON.stringify(this._afterData) : null,
      versionJson: JSON.stringify(this._version.toServerDTO()),
      isSynced: this._isSynced,
      syncedInSessionId: this._syncedInSessionId ?? null,
      createdAt: this._createdAt,
      syncedAt: this._syncedAt ?? null,
    };
  }
}
