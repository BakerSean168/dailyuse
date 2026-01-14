/**
 * Pending Change Entity - Client Interface
 * 待同步变更实体（客户端）
 */

import type { ChangeOperationType } from '../enums';
import type { EntityReferenceDTO } from '../value-objects';

// ============ DTO 定义 ============

export interface PendingChangeClientDTO {
  uuid: string;
  entityRef: EntityReferenceDTO;
  operation: ChangeOperationType;
  summary: string;
  isSynced: boolean;
  createdAt: number;
  syncedAt?: number | null;
}

// ============ 接口定义 ============

export interface PendingChangeClient {
  uuid: string;
  entityRef: EntityReferenceDTO;
  operation: ChangeOperationType;
  summary: string;
  isSynced: boolean;

  toClientDTO(): PendingChangeClientDTO;
}

export interface PendingChangeClientStatic {
  fromClientDTO(dto: PendingChangeClientDTO): PendingChangeClient;
}
