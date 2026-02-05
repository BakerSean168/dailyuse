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
  type SyncableEntityType,
} from '@dailyuse/contracts/sync';
import { SyncVersion } from '../value-objects/SyncVersion';

type ConflictType = 'update-update' | 'update-delete' | 'delete-update';

/**
 * SyncConflict 实体
 *
 * 表示一个同步冲突
 */
export class SyncConflict extends Entity<string> {
  private _sessionId: string;
  private _entityRef: EntityReferenceDTO;
  private _conflictType: ConflictType;
  private _localVersion: SyncVersion;
  private _localData: unknown;
  private _remoteVersion: SyncVersion;
  private _remoteData: unknown;
  private _status: ConflictStatus;
  private _autoResolvable: boolean;
  private _resolution?: ConflictResolutionDTO | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(params: {
    id: string;
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
    super(params.id);
    this._sessionId = params.sessionId;
    this._entityRef = params.entityRef;
    this._conflictType = params.conflictType;
    this._localVersion = SyncVersion.fromServerDTO(params.localVersion);
    this._localData = params.localData;
    this._remoteVersion = SyncVersion.fromServerDTO(params.remoteVersion);
    this._remoteData = params.remoteData;
    this._status = params.status;
    this._autoResolvable = params.autoResolvable;
    this._resolution = params.resolution ?? null;
    this._createdAt = new Date(params.createdAt);
    this._updatedAt = new Date(params.updatedAt);
  }

  // ===== Getters =====

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
    return this._localVersion.toServerDTO();
  }

  get localData(): unknown {
    return this._localData;
  }

  get remoteVersion(): SyncVersionServerDTO {
    return this._remoteVersion.toServerDTO();
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

  get resolution(): ConflictResolutionDTO | null {
    return this._resolution ?? null;
  }

  get createdAt(): number {
    return this._createdAt.getTime();
  }

  get updatedAt(): number {
    return this._updatedAt.getTime();
  }

  // ===== 静态工厂方法 =====

  /**
   * 创建新的冲突记录
   */
  static create(params: {
    id: string;
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
      status: ConflictStatus.Unresolved,
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
      id: dto.id,
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
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  /**
   * 从 PersistenceDTO 重建
   */
  static fromPersistenceDTO(dto: SyncConflictPersistenceDTO): SyncConflict {
    return new SyncConflict({
      id: dto.id,
      sessionId: dto.sessionId,
      entityRef: {
        entityType: dto.entityType as SyncableEntityType,
        entityId: dto.entityId,
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
      createdAt: dto.createdAt.getTime(),
      updatedAt: dto.updatedAt.getTime(),
    });
  }

  // ===== 业务方法 =====

  /**
   * 解决冲突
   */
  resolve(resolution: ConflictResolutionDTO): void {
    if (this._status === ConflictStatus.Resolved) {
      throw new Error('SyncConflict: conflict is already resolved');
    }
    this._resolution = resolution;
    this._status = ConflictStatus.Resolved;
    this._updatedAt = new Date();
  }

  /**
   * 标记为忽略
   */
  ignore(): void {
    if (this._status === ConflictStatus.Resolved) {
      throw new Error('SyncConflict: conflict is already resolved');
    }
    this._status = ConflictStatus.Ignored;
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
    return this._status === ConflictStatus.Resolved;
  }

  /**
   * 是否待处理
   */
  get isPending(): boolean {
    return this._status === ConflictStatus.Unresolved;
  }

  // ===== DTO 转换 =====

  toServerDTO(): SyncConflictServerDTO {
    return {
      id: this.id,
      sessionId: this._sessionId,
      entityRef: this._entityRef,
      conflictType: this._conflictType,
      localVersion: this._localVersion.toServerDTO(),
      localData: this._localData,
      remoteVersion: this._remoteVersion.toServerDTO(),
      remoteData: this._remoteData,
      status: this._status,
      autoResolvable: this._autoResolvable,
      resolution: this._resolution ?? null,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }

  toClientDTO(): SyncConflictClientDTO {
    return {
      id: this.id,
      sessionId: this._sessionId,
      entityRef: this._entityRef,
      conflictType: this._conflictType,
      localVersion: this._localVersion.toServerDTO(),
      localData: this._localData,
      remoteVersion: this._remoteVersion.toServerDTO(),
      remoteData: this._remoteData,
      status: this._status,
      autoResolvable: this._autoResolvable,
      resolution: this._resolution ?? null,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      summary: this._generateSummary(),
      conflictedFields: this._detectConflictedFields(),
    };
  }

  /**
   * 生成冲突摘要
   */
  private _generateSummary(): string {
    const entityName = this._entityRef.entityName ?? this._entityRef.entityId.substring(0, 8);
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
      id: this.id,
      sessionId: this._sessionId,
      entityType: this._entityRef.entityType,
      entityId: this._entityRef.entityId,
      entityName: this._entityRef.entityName ?? null,
      conflictType: this._conflictType,
      localVersionJson: JSON.stringify(this._localVersion.toServerDTO()),
      localDataJson: JSON.stringify(this._localData),
      remoteVersionJson: JSON.stringify(this._remoteVersion.toServerDTO()),
      remoteDataJson: JSON.stringify(this._remoteData),
      status: this._status,
      autoResolvable: this._autoResolvable,
      resolutionJson: this._resolution ? JSON.stringify(this._resolution) : null,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
