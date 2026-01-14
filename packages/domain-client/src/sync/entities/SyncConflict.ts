/**
 * SyncConflict 实体 (Client)
 * 同步冲突
 */

import { Entity } from '@dailyuse/utils';
import {
  ConflictStatus,
  type SyncConflictClientDTO,
  type EntityReferenceDTO,
  type SyncVersionClientDTO,
  type ConflictResolutionDTO,
} from '@dailyuse/contracts/sync';
import { EntityReference } from '../value-objects/EntityReference';
import { SyncVersion } from '../value-objects/SyncVersion';
import { ConflictResolution } from '../value-objects/ConflictResolution';

type ConflictType = 'update-update' | 'update-delete' | 'delete-update';

/**
 * SyncConflict 实体
 *
 * 客户端同步冲突表示
 */
export class SyncConflict extends Entity {
  private _sessionId: string;
  private _entityRef: EntityReference;
  private _conflictType: ConflictType;
  private _localVersion: SyncVersion;
  private _localData: unknown;
  private _remoteVersion: SyncVersion;
  private _remoteData: unknown;
  private _status: ConflictStatus;
  private _autoResolvable: boolean;
  private _resolution?: ConflictResolution | null;
  private _summary: string;
  private _conflictedFields: string[];
  private _createdAt: number;
  private _updatedAt: number;

  private constructor(params: {
    uuid: string;
    sessionId: string;
    entityRef: EntityReference;
    conflictType: ConflictType;
    localVersion: SyncVersion;
    localData: unknown;
    remoteVersion: SyncVersion;
    remoteData: unknown;
    status: ConflictStatus;
    autoResolvable: boolean;
    resolution?: ConflictResolution | null;
    summary: string;
    conflictedFields: string[];
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
    this._summary = params.summary;
    this._conflictedFields = params.conflictedFields;
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

  get entityRef(): EntityReference {
    return this._entityRef;
  }

  get conflictType(): ConflictType {
    return this._conflictType;
  }

  get localVersion(): SyncVersion {
    return this._localVersion;
  }

  get localData(): unknown {
    return this._localData;
  }

  get remoteVersion(): SyncVersion {
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

  get resolution(): ConflictResolution | null | undefined {
    return this._resolution;
  }

  get summary(): string {
    return this._summary;
  }

  get conflictedFields(): string[] {
    return [...this._conflictedFields];
  }

  get createdAt(): number {
    return this._createdAt;
  }

  get updatedAt(): number {
    return this._updatedAt;
  }

  // ===== 静态工厂方法 =====

  static fromClientDTO(dto: SyncConflictClientDTO): SyncConflict {
    return new SyncConflict({
      uuid: dto.uuid,
      sessionId: dto.sessionId,
      entityRef: EntityReference.fromDTO(dto.entityRef),
      conflictType: dto.conflictType,
      localVersion: SyncVersion.fromClientDTO(dto.localVersion),
      localData: dto.localData,
      remoteVersion: SyncVersion.fromClientDTO(dto.remoteVersion),
      remoteData: dto.remoteData,
      status: dto.status,
      autoResolvable: dto.autoResolvable,
      resolution: dto.resolution ? ConflictResolution.fromDTO(dto.resolution) : null,
      summary: dto.summary,
      conflictedFields: dto.conflictedFields,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  // ===== UI 辅助属性 =====

  /**
   * 冲突类型显示文本
   */
  get conflictTypeDisplay(): string {
    const map: Record<ConflictType, string> = {
      'update-update': '双方都更新了',
      'update-delete': '本地更新，远程删除',
      'delete-update': '本地删除，远程更新',
    };
    return map[this._conflictType];
  }

  /**
   * 状态显示文本
   */
  get statusDisplay(): string {
    const map: Record<ConflictStatus, string> = {
      [ConflictStatus.UNRESOLVED]: '待处理',
      [ConflictStatus.RESOLVED]: '已解决',
      [ConflictStatus.IGNORED]: '已忽略',
    };
    return map[this._status];
  }

  /**
   * 状态颜色
   */
  get statusColor(): string {
    const colorMap: Record<ConflictStatus, string> = {
      [ConflictStatus.UNRESOLVED]: '#f59e0b',
      [ConflictStatus.RESOLVED]: '#10b981',
      [ConflictStatus.IGNORED]: '#6b7280',
    };
    return colorMap[this._status];
  }

  /**
   * 状态徽章样式
   */
  get statusBadgeClass(): string {
    const classMap: Record<ConflictStatus, string> = {
      [ConflictStatus.UNRESOLVED]: 'badge-warning',
      [ConflictStatus.RESOLVED]: 'badge-success',
      [ConflictStatus.IGNORED]: 'badge-secondary',
    };
    return classMap[this._status];
  }

  /**
   * 冲突字段数量
   */
  get conflictedFieldCount(): number {
    return this._conflictedFields.length;
  }

  /**
   * 冲突字段显示文本
   */
  get conflictedFieldsDisplay(): string {
    if (this._conflictedFields.length === 0) return '无冲突字段';
    if (this._conflictedFields.length <= 3) {
      return this._conflictedFields.join('、');
    }
    return `${this._conflictedFields.slice(0, 3).join('、')} 等 ${this._conflictedFields.length} 个字段`;
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

  /**
   * 是否已忽略
   */
  get isIgnored(): boolean {
    return this._status === ConflictStatus.IGNORED;
  }

  /**
   * 创建时间格式化
   */
  get createdAtFormatted(): string {
    return new Date(this._createdAt).toLocaleString();
  }

  // ===== DTO 转换 =====

  toClientDTO(): SyncConflictClientDTO {
    return {
      uuid: this.uuid,
      sessionId: this._sessionId,
      entityRef: this._entityRef.toDTO(),
      conflictType: this._conflictType,
      localVersion: this._localVersion.toClientDTO(),
      localData: this._localData,
      remoteVersion: this._remoteVersion.toClientDTO(),
      remoteData: this._remoteData,
      status: this._status,
      autoResolvable: this._autoResolvable,
      resolution: this._resolution?.toDTO() ?? null,
      summary: this._summary,
      conflictedFields: [...this._conflictedFields],
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
