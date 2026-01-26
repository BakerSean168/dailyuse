/**
 * SyncConflict 实体
 * 同步冲突记录
 */

import { Entity } from '@dailyuse/utils';
import {
  ConflictStatus,
  type SyncConflictServerDTO,
  type SyncConflictClientDTO,
  type SyncConflictPersistenceDTO,
  type EntityReferenceDTO,
  type SyncVersionServerDTO,
  type ConflictResolutionDTO,
} from '@dailyuse/contracts/sync';

type ConflictType = 'update-update' | 'update-delete' | 'delete-update';

/**
 * SyncConflict 实体
 *
 * 表示一个同步冲突
 */
export class SyncConflict extends Entity {
  private _sessionId: string;
  private _entityRef: EntityReferenceDTO;
  private _conflictType: ConflictType;
  private _localVersion: SyncVersionServerDTO;
  private _localData: unknown;
  private _remoteVersion: SyncVersionServerDTO;
  private _remoteData: unknown;
  private _status: ConflictStatus;
  private _autoResolvable: boolean;
  private _resolution?: ConflictResolutionDTO | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(params: {
    uuid: string;
    sessionId: string;
    entityRef: EntityReferenceDTO;
    conflictType: ConflictType;
    localVersion: SyncVersionServerDTO;
    localData: unknown;
    remoteVersion: SyncVersionServerDTO;
    remoteData: unknown;
    status: ConflictStatus;
    autoResolvable: boolean;
    resolution?: ConflictResolutionDTO | null;
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid);
    this._sessionId = params.sessionId;
    this._entityRef = params.entityRef;
    this._conflictType = params.conflictType;
    this._localVersion = params.localVersion;
    this._localData = params.localData;
    this._remoteVersion = params.remoteVersion;
    this._remoteData = params.remoteData;
    this._status = params.status;
    this._autoResolvable = params.autoResolvable;
    this._resolution = params.resolution;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ===== Getters =====

  override get uuid(): string {
    return this._uuid;
  }

  get sessionId(): string {
    return this._sessionId;
  }

  get entityRef(): EntityReferenceDTO {
    return this._entityRef;
  }

  get conflictType(): ConflictType {
    return this._conflictType;
  }

  get localVersion(): SyncVersionServerDTO {
    return this._localVersion;
  }

  get localData(): unknown {
    return this._localData;
  }

  get remoteVersion(): SyncVersionServerDTO {
    return this._remoteVersion;
  }

  get remoteData(): unknown {
    return this._remoteData;
  }

  get status(): ConflictStatus {
    return this._status;
  }

  get autoResolvable(): boolean {
    return this._autoResolvable;
  }

  get resolution(): ConflictResolutionDTO | undefined | null {
    return this._resolution;
  }

  get createdAt(): number {
    return this._createdAt;
  }

  get updatedAt(): number {
    return this._updatedAt;
  }

  // ===== 静态工厂方法 =====

  /**
   * 创建新的冲突记录
   */
  static create(params: {
    uuid: string;
    sessionId: string;
    entityRef: EntityReferenceDTO;
    conflictType: ConflictType;
    localVersion: SyncVersionServerDTO;
    localData: unknown;
    remoteVersion: SyncVersionServerDTO;
    remoteData: unknown;
  }): SyncConflict {
    const now = Date.now();
    return new SyncConflict({
      ...params,
      status: ConflictStatus.UNRESOLVED,
      autoResolvable: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 从 ServerDTO 重建
   */
  static fromServerDTO(dto: SyncConflictServerDTO): SyncConflict {
    return new SyncConflict({
      uuid: dto.uuid,
      sessionId: dto.sessionId,
      entityRef: dto.entityRef,
      conflictType: dto.conflictType,
      localVersion: dto.localVersion,
      localData: dto.localData,
      remoteVersion: dto.remoteVersion,
      remoteData: dto.remoteData,
      status: dto.status,
      autoResolvable: dto.autoResolvable,
      resolution: dto.resolution,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  /**
   * 从 PersistenceDTO 重建
   */
  static fromPersistenceDTO(dto: SyncConflictPersistenceDTO): SyncConflict {
    return new SyncConflict({
      uuid: dto.uuid,
      sessionId: dto.sessionId,
      entityRef: {
        entityType: dto.entityType as any,
        entityUuid: dto.entityUuid,
        entityName: dto.entityName ?? undefined,
      },
      conflictType: dto.conflictType as ConflictType,
      localVersion: JSON.parse(dto.localVersionJson),
      localData: JSON.parse(dto.localDataJson),
      remoteVersion: JSON.parse(dto.remoteVersionJson),
      remoteData: JSON.parse(dto.remoteDataJson),
      status: dto.status as ConflictStatus,
      autoResolvable: dto.autoResolvable,
      resolution: dto.resolutionJson ? JSON.parse(dto.resolutionJson) : null,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  // ===== 业务方法 =====

  /**
   * 解决冲突
   */
  resolve(resolution: ConflictResolutionDTO): void {
    if (this._status === ConflictStatus.RESOLVED) {
      throw new Error('SyncConflict: conflict is already resolved');
    }
    this._resolution = resolution;
    this._status = ConflictStatus.RESOLVED;
    this._updatedAt = new Date();
  }

  /**
   * 标记为忽略
   */
  ignore(): void {
    if (this._status === ConflictStatus.RESOLVED) {
      throw new Error('SyncConflict: conflict is already resolved');
    }
    this._status = ConflictStatus.IGNORED;
    this._updatedAt = new Date();
  }

  /**
   * 是否可以自动解决
   */
  canAutoResolve(): boolean {
    return this._autoResolvable;
  }

  /**
   * 是否已解决
   */
  get isResolved(): boolean {
    return this._status === ConflictStatus.RESOLVED;
  }

  /**
   * 是否待处理
   */
  get isPending(): boolean {
    return this._status === ConflictStatus.UNRESOLVED;
  }

  // ===== DTO 转换 =====

  toServerDTO(): SyncConflictServerDTO {
    return {
      uuid: this.uuid,
      sessionId: this._sessionId,
      entityRef: this._entityRef,
      conflictType: this._conflictType,
      localVersion: this._localVersion,
      localData: this._localData,
      remoteVersion: this._remoteVersion,
      remoteData: this._remoteData,
      status: this._status,
      autoResolvable: this._autoResolvable,
      resolution: this._resolution,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  toClientDTO(): SyncConflictClientDTO {
    return {
      uuid: this.uuid,
      sessionId: this._sessionId,
      entityRef: this._entityRef,
      conflictType: this._conflictType,
      localVersion: this._localVersion,
      localData: this._localData,
      remoteVersion: this._remoteVersion,
      remoteData: this._remoteData,
      status: this._status,
      autoResolvable: this._autoResolvable,
      resolution: this._resolution,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      summary: this._generateSummary(),
      conflictedFields: this._detectConflictedFields(),
    };
  }

  /**
   * 生成冲突摘要
   */
  private _generateSummary(): string {
    const entityName = this._entityRef.entityName ?? this._entityRef.entityUuid.substring(0, 8);
    const typeText = {
      'update-update': '双方都更新了',
      'update-delete': '本地更新，远程删除',
      'delete-update': '本地删除，远程更新',
    }[this._conflictType];
    return `${typeText} ${this._entityRef.entityType}: ${entityName}`;
  }

  /**
   * 检测冲突字段
   */
  private _detectConflictedFields(): string[] {
    if (this._conflictType !== 'update-update') {
      return [];
    }
    if (!this._localData || !this._remoteData) {
      return [];
    }
    const localObj = this._localData as Record<string, unknown>;
    const remoteObj = this._remoteData as Record<string, unknown>;
    const fields: string[] = [];
    for (const key of Object.keys(localObj)) {
      if (JSON.stringify(localObj[key]) !== JSON.stringify(remoteObj[key])) {
        fields.push(key);
      }
    }
    return fields;
  }

  toPersistenceDTO(): SyncConflictPersistenceDTO {
    return {
      uuid: this.uuid,
      sessionId: this._sessionId,
      entityType: this._entityRef.entityType,
      entityUuid: this._entityRef.entityUuid,
      entityName: this._entityRef.entityName ?? null,
      conflictType: this._conflictType,
      localVersionJson: JSON.stringify(this._localVersion),
      localDataJson: JSON.stringify(this._localData),
      remoteVersionJson: JSON.stringify(this._remoteVersion),
      remoteDataJson: JSON.stringify(this._remoteData),
      status: this._status,
      autoResolvable: this._autoResolvable,
      resolutionJson: this._resolution ? JSON.stringify(this._resolution) : null,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
