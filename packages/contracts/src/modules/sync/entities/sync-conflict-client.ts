/**
 * Sync Conflict Entity - Client Interface
 * 同步冲突实体（客户端�?
 */

import type { SyncConflictId, SyncSessionId, TransferDate } from '@/primitives';
import type { ConflictStatus } from '../value-objects/conflict-status';
import type { EntityReferenceDTO, SyncVersionClientDTO, ConflictResolutionDTO } from '../value-objects';

// ============ DTO 定义 ============

export interface SyncConflictClientDTO {
  id: string;
  sessionId: string;
  entityRef: EntityReferenceDTO;
  conflictType: 'update-update' | 'update-delete' | 'delete-update';
  localVersion: SyncVersionClientDTO;
  localData: unknown;
  remoteVersion: SyncVersionClientDTO;
  remoteData: unknown;
  status: ConflictStatus;
  autoResolvable: boolean;
  resolution: ConflictResolutionDTO | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  // 客户端专�?
  summary: string;
  conflictedFields: string[];
}

// ============ 接口定义 ============

export interface SyncConflictClient {
  id: SyncConflictId;
  sessionId: SyncSessionId;
  entityRef: EntityReferenceDTO;
  conflictType: 'update-update' | 'update-delete' | 'delete-update';
  status: ConflictStatus;
  autoResolvable: boolean;
  summary: string;
  conflictedFields: string[];
}
