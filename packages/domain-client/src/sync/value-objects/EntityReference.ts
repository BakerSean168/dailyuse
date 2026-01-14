/**
 * EntityReference 值对象 (Client)
 * 实体引用 - 标识可同步的实体
 */

import { ValueObject } from '@dailyuse/utils';
import { SyncableEntityType, type EntityReferenceDTO } from '@dailyuse/contracts/sync';

/**
 * EntityReference 值对象
 */
export class EntityReference extends ValueObject {
  public readonly entityType: SyncableEntityType;
  public readonly entityUuid: string;
  public readonly entityName?: string;

  private constructor(params: {
    entityType: SyncableEntityType;
    entityUuid: string;
    entityName?: string;
  }) {
    super();
    this.entityType = params.entityType;
    this.entityUuid = params.entityUuid;
    this.entityName = params.entityName;
  }

  // ===== 静态工厂方法 =====

  static fromDTO(dto: EntityReferenceDTO): EntityReference {
    return new EntityReference({
      entityType: dto.entityType,
      entityUuid: dto.entityUuid,
      entityName: dto.entityName,
    });
  }

  // ===== UI 辅助属性 =====

  /**
   * 实体类型显示文本
   */
  get entityTypeDisplay(): string {
    const typeMap: Record<SyncableEntityType, string> = {
      [SyncableEntityType.GOAL]: '目标',
      [SyncableEntityType.KEY_RESULT]: '关键结果',
      [SyncableEntityType.GOAL_RECORD]: '目标记录',
      [SyncableEntityType.GOAL_REVIEW]: '目标回顾',
      [SyncableEntityType.TASK]: '任务',
      [SyncableEntityType.SCHEDULE]: '日程',
      [SyncableEntityType.REMINDER]: '提醒',
      [SyncableEntityType.SETTINGS]: '设置',
    };
    return typeMap[this.entityType] ?? this.entityType;
  }

  /**
   * 实体类型图标
   */
  get entityTypeIcon(): string {
    const iconMap: Record<SyncableEntityType, string> = {
      [SyncableEntityType.GOAL]: '🎯',
      [SyncableEntityType.KEY_RESULT]: '📊',
      [SyncableEntityType.GOAL_RECORD]: '📝',
      [SyncableEntityType.GOAL_REVIEW]: '📋',
      [SyncableEntityType.TASK]: '✅',
      [SyncableEntityType.SCHEDULE]: '📅',
      [SyncableEntityType.REMINDER]: '⏰',
      [SyncableEntityType.SETTINGS]: '⚙️',
    };
    return iconMap[this.entityType] ?? '📦';
  }

  /**
   * 显示名称
   */
  get displayName(): string {
    return this.entityName ?? this.entityUuid.substring(0, 8);
  }

  /**
   * 完整显示文本
   */
  get fullDisplay(): string {
    return `${this.entityTypeIcon} ${this.entityTypeDisplay}: ${this.displayName}`;
  }

  /**
   * 复合键
   */
  get compositeKey(): string {
    return `${this.entityType}:${this.entityUuid}`;
  }

  // ===== ValueObject 方法 =====

  override equals(other: ValueObject): boolean {
    if (!(other instanceof EntityReference)) return false;
    return (
      this.entityType === other.entityType &&
      this.entityUuid === other.entityUuid
    );
  }

  // ===== DTO 转换 =====

  toDTO(): EntityReferenceDTO {
    return {
      entityType: this.entityType,
      entityUuid: this.entityUuid,
      entityName: this.entityName,
    };
  }
}
