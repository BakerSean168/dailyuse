/**
 * PendingChange 实体 (Client)
 * 待同步变更
 */

import { Entity } from '@dailyuse/utils';
import {
  ChangeOperationType,
  type PendingChangeClientDTO,
  type EntityReferenceDTO,
} from '@dailyuse/contracts/sync';
import { EntityReference } from '../value-objects/EntityReference';

/**
 * PendingChange 实体
 *
 * 客户端待同步变更表示
 */
export class PendingChange extends Entity {
  private _entityRef: EntityReference;
  private _operation: ChangeOperationType;
  private _summary: string;
  private _isSynced: boolean;
  private _createdAt: number;
  private _syncedAt?: number | null;

  private constructor(params: {
    uuid: string;
    entityRef: EntityReference;
    operation: ChangeOperationType;
    summary: string;
    isSynced: boolean;
    createdAt: number;
    syncedAt?: number | null;
  }) {
    super(params.uuid);
    this._entityRef = params.entityRef;
    this._operation = params.operation;
    this._summary = params.summary;
    this._isSynced = params.isSynced;
    this._createdAt = params.createdAt;
    this._syncedAt = params.syncedAt;
  }

  // ===== Getters =====

  override get uuid(): string {
    return this._uuid;
  }

  get entityRef(): EntityReference {
    return this._entityRef;
  }

  get operation(): ChangeOperationType {
    return this._operation;
  }

  get summary(): string {
    return this._summary;
  }

  get isSynced(): boolean {
    return this._isSynced;
  }

  get createdAt(): number {
    return this._createdAt;
  }

  get syncedAt(): number | null | undefined {
    return this._syncedAt;
  }

  // ===== 静态工厂方法 =====

  static fromClientDTO(dto: PendingChangeClientDTO): PendingChange {
    return new PendingChange({
      uuid: dto.uuid,
      entityRef: EntityReference.fromDTO(dto.entityRef),
      operation: dto.operation,
      summary: dto.summary,
      isSynced: dto.isSynced,
      createdAt: dto.createdAt,
      syncedAt: dto.syncedAt,
    });
  }

  // ===== UI 辅助属性 =====

  /**
   * 操作类型显示文本
   */
  get operationDisplay(): string {
    const map: Record<ChangeOperationType, string> = {
      [ChangeOperationType.CREATE]: '创建',
      [ChangeOperationType.UPDATE]: '更新',
      [ChangeOperationType.DELETE]: '删除',
      [ChangeOperationType.RESTORE]: '恢复',
    };
    return map[this._operation];
  }

  /**
   * 操作类型图标
   */
  get operationIcon(): string {
    const iconMap: Record<ChangeOperationType, string> = {
      [ChangeOperationType.CREATE]: '➕',
      [ChangeOperationType.UPDATE]: '✏️',
      [ChangeOperationType.DELETE]: '🗑️',
      [ChangeOperationType.RESTORE]: '♻️',
    };
    return iconMap[this._operation];
  }

  /**
   * 操作类型颜色
   */
  get operationColor(): string {
    const colorMap: Record<ChangeOperationType, string> = {
      [ChangeOperationType.CREATE]: '#10b981',
      [ChangeOperationType.UPDATE]: '#3b82f6',
      [ChangeOperationType.DELETE]: '#ef4444',
      [ChangeOperationType.RESTORE]: '#8b5cf6',
    };
    return colorMap[this._operation];
  }

  /**
   * 同步状态显示
   */
  get syncStatusDisplay(): string {
    return this._isSynced ? '已同步' : '待同步';
  }

  /**
   * 同步状态颜色
   */
  get syncStatusColor(): string {
    return this._isSynced ? '#10b981' : '#f59e0b';
  }

  /**
   * 创建时间格式化
   */
  get createdAtFormatted(): string {
    return new Date(this._createdAt).toLocaleString();
  }

  /**
   * 创建时间相对描述
   */
  get createdAtRelative(): string {
    const now = Date.now();
    const diff = now - this._createdAt;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} 天前`;
    if (hours > 0) return `${hours} 小时前`;
    if (minutes > 0) return `${minutes} 分钟前`;
    return '刚刚';
  }

  /**
   * 同步时间格式化
   */
  get syncedAtFormatted(): string | null {
    return this._syncedAt ? new Date(this._syncedAt).toLocaleString() : null;
  }

  /**
   * 完整显示文本
   */
  get fullDisplay(): string {
    return `${this.operationIcon} ${this._summary}`;
  }

  // ===== DTO 转换 =====

  toClientDTO(): PendingChangeClientDTO {
    return {
      uuid: this.uuid,
      entityRef: this._entityRef.toDTO(),
      operation: this._operation,
      summary: this._summary,
      isSynced: this._isSynced,
      createdAt: this._createdAt,
      syncedAt: this._syncedAt,
    };
  }
}
