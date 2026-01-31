/**
 * Pending Change Entity - Client Interface
 * 待同步变更实体（客户端）
 */

import type { PendingChangeId, TransferDate } from '@/primitives';
import type { ChangeOperationType } from '../value-objects/change-operation-type';
import type { EntityReferenceDTO } from '../value-objects';

// ============ DTO 定义 ============

export interface PendingChangeClientDTO {
  id: string;
  entityRef: EntityReferenceDTO;
  operation: ChangeOperationType;
  summary: string;
  isSynced: boolean;
  createdAt: TransferDate;
  syncedAt: TransferDate | null;
}

// ============ 接口定义 ============

export interface PendingChangeClient {
  id: PendingChangeId;
  entityRef: EntityReferenceDTO;
  operation: ChangeOperationType;
  summary: string;
  isSynced: boolean;
}
