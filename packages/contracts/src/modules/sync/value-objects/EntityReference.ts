/**
 * Entity Reference Value Object
 * 实体引用值对象
 */

import type { SyncableEntityType } from '../enums';

// ============ DTO 定义 ============

export interface EntityReferenceDTO {
  entityType: SyncableEntityType;
  entityUuid: string;
  entityName?: string;
}

// ============ 接口定义 ============

export interface IEntityReference {
  entityType: SyncableEntityType;
  entityUuid: string;
  entityName?: string;

  equals(other: IEntityReference): boolean;
  toString(): string;
  toDTO(): EntityReferenceDTO;
}
