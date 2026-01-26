/**
 * PendingChange 实体
 * 待同步的本地变更记录
 */

import { Entity } from '@dailyuse/utils';
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
export class PendingChange extends Entity {
  private _entityRef: EntityReferenceDTO;
  private _operation: ChangeOperationType;
  private _beforeData?: unknown | null;
  private _afterData?: unknown | null;
  private _version: SyncVersion;
  private _isSynced: boolean;
  private _syncedInSession?: string | null;
  private _createdAt: Date;
  private _syncedAt?: number | null;

  private constructor(params: {
    uuid: string;
    entityRef: EntityReferenceDTO;
    operation: ChangeOperationType;
    beforeData?: unknown | null;
    afterData?: unknown | null;
    version: SyncVersionServerDTO;
    isSynced: boolean;
    syncedInSession?: string | null;
    createdAt: number;
    syncedAt?: number | null;
  }) {
    super(params.uuid);
    this._entityRef = params.entityRef;
    this._operation = params.operation;
    this._beforeData = params.beforeData;
    this._afterData = params.afterData;
    this._version = SyncVersion.fromServerDTO(params.version);
    this._isSynced = params.isSynced;
    this._syncedInSession = params.syncedInSession;
    this._createdAt = params.createdAt;
    this._syncedAt = params.syncedAt;
  }

  // ===== Getters =====

  override get uuid(): string {
    return this._uuid;
  }

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
    return this._version;
  }

  get isSynced(): boolean {
    return this._isSynced;
  }

  get syncedInSession(): string | null | undefined {
    return this._syncedInSession;
  }

  get createdAt(): number {
    return this._createdAt;
  }

  get syncedAt(): number | null | undefined {
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
      uuid: Entity.generateUUID(),
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
      uuid: dto.uuid,
      entityRef: dto.entityRef,
      operation: dto.operation,
      beforeData: dto.beforeData,
      afterData: dto.afterData,
      version: dto.version,
      isSynced: dto.isSynced,
      syncedInSession: dto.syncedInSession,
      createdAt: new Date(dto.createdAt),
      syncedAt: dto.syncedAt,
    });
  }

  /**
   * 从 PersistenceDTO 重建
   */
  static fromPersistenceDTO(dto: PendingChangePersistenceDTO): PendingChange {
    return new PendingChange({
      uuid: dto.uuid,
      entityRef: {
        entityType: dto.entityType as any,
        entityUuid: dto.entityUuid,
        entityName: dto.entityName ?? undefined,
      },
      operation: dto.operation as ChangeOperationType,
      beforeData: dto.beforeDataJson ? JSON.parse(dto.beforeDataJson) : null,
      afterData: dto.afterDataJson ? JSON.parse(dto.afterDataJson) : null,
      version: JSON.parse(dto.versionJson),
      isSynced: dto.isSynced,
      syncedInSession: dto.syncedInSession,
      createdAt: new Date(dto.createdAt),
      syncedAt: dto.syncedAt,
    });
  }

  // ===== 业务方法 =====

  /**
   * 标记为已同步
   */
  markAsSynced(sessionId: string): void {
    this._isSynced = true;
    this._syncedInSession = sessionId;
    this._syncedAt = new Date();
  }

  /**
   * 是否为创建操作
   */
  get isCreate(): boolean {
    return this._operation === ChangeOperationType.CREATE;
  }

  /**
   * 是否为更新操作
   */
  get isUpdate(): boolean {
    return this._operation === ChangeOperationType.UPDATE;
  }

  /**
   * 是否为删除操作
   */
  get isDelete(): boolean {
    return this._operation === ChangeOperationType.DELETE;
  }

  // ===== DTO 转换 =====

  toServerDTO(): PendingChangeServerDTO {
    return {
      uuid: this.uuid,
      entityRef: this._entityRef,
      operation: this._operation,
      beforeData: this._beforeData,
      afterData: this._afterData,
      version: this._version,
      isSynced: this._isSynced,
      syncedInSession: this._syncedInSession,
      createdAt: this._createdAt,
      syncedAt: this._syncedAt,
    };
  }

  toClientDTO(): PendingChangeClientDTO {
    return {
      uuid: this.uuid,
      entityRef: this._entityRef,
      operation: this._operation,
      summary: this._generateSummary(),
      isSynced: this._isSynced,
      createdAt: this._createdAt,
      syncedAt: this._syncedAt,
    };
  }

  /**
   * 生成变更摘要
   */
  private _generateSummary(): string {
    const operationText: Record<ChangeOperationType, string> = {
      [ChangeOperationType.CREATE]: '创建',
      [ChangeOperationType.UPDATE]: '更新',
      [ChangeOperationType.DELETE]: '删除',
      [ChangeOperationType.RESTORE]: '恢复',
    };
    const entityName = this._entityRef.entityName ?? this._entityRef.entityUuid.substring(0, 8);
    return `${operationText[this._operation]} ${this._entityRef.entityType}: ${entityName}`;
  }

  toPersistenceDTO(): PendingChangePersistenceDTO {
    return {
      uuid: this.uuid,
      entityType: this._entityRef.entityType,
      entityUuid: this._entityRef.entityUuid,
      entityName: this._entityRef.entityName ?? null,
      operation: this._operation,
      beforeDataJson: this._beforeData ? JSON.stringify(this._beforeData) : null,
      afterDataJson: this._afterData ? JSON.stringify(this._afterData) : null,
      versionJson: JSON.stringify(this._version),
      isSynced: this._isSynced,
      syncedInSession: this._syncedInSession ?? null,
      createdAt: this._createdAt,
      syncedAt: this._syncedAt ?? null,
    };
  }
}
