/**
 * Entity Reference Value Object
 * 实体引用值对�?
 */

import type { SyncableEntityType } from './syncable-entity-type';

// ============ DTO 定义 ============

export interface EntityReferenceDTO {
  entityType: SyncableEntityType;
  entityId: string;
  entityName?: string;
}

// ============ 接口定义 ============

export interface IEntityReference {
  entityType: SyncableEntityType;
  entityId: string;
  entityName?: string;

  equals(other: IEntityReference): boolean;
  toString(): string;
  toDTO(): EntityReferenceDTO;
}
