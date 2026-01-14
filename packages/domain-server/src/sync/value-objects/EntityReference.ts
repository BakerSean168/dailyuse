/**
 * EntityReference 值对象
 * 实体引用 - 标识可同步的实体
 */

import { ValueObject } from '@dailyuse/utils';
import { SyncableEntityType, type EntityReferenceDTO } from '@dailyuse/contracts/sync';

/**
 * EntityReference 值对象
 *
 * 唯一标识一个可同步的实体
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
    Object.freeze(this);
  }

  // ===== 静态工厂方法 =====

  /**
   * 创建实体引用
   */
  static create(
    entityType: SyncableEntityType,
    entityUuid: string,
    entityName?: string,
  ): EntityReference {
    if (!entityUuid || entityUuid.trim() === '') {
      throw new Error('EntityReference: entityUuid cannot be empty');
    }
    return new EntityReference({ entityType, entityUuid, entityName });
  }

  /**
   * 从 DTO 创建
   */
  static fromDTO(dto: EntityReferenceDTO): EntityReference {
    return new EntityReference({
      entityType: dto.entityType,
      entityUuid: dto.entityUuid,
      entityName: dto.entityName,
    });
  }

  // ===== 业务方法 =====

  /**
   * 获取复合键
   */
  get compositeKey(): string {
    return `${this.entityType}:${this.entityUuid}`;
  }

  /**
   * 判断是否引用同一个实体
   */
  isSameEntity(other: EntityReference): boolean {
    return (
      this.entityType === other.entityType &&
      this.entityUuid === other.entityUuid
    );
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
