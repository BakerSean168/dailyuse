/**
 * Sync Conflict Entity - Client Interface
 * 同步冲突实体（客户端）
 */

import type { ConflictStatus } from '../enums';
import type { EntityReferenceDTO, SyncVersionClientDTO, ConflictResolutionDTO } from '../value-objects';

// ============ DTO 定义 ============

export interface SyncConflictClientDTO {
  uuid: string;
  sessionId: string;
  entityRef: EntityReferenceDTO;
  conflictType: 'update-update' | 'update-delete' | 'delete-update';
  localVersion: SyncVersionClientDTO;
  localData: unknown;
  remoteVersion: SyncVersionClientDTO;
  remoteData: unknown;
  status: ConflictStatus;
  autoResolvable: boolean;
  resolution?: ConflictResolutionDTO | null;
  createdAt: number;
  updatedAt: number;
  // 客户端专用
  summary: string;
  conflictedFields: string[];
}

// ============ 接口定义 ============

export interface SyncConflictClient {
  uuid: string;
  sessionId: string;
  entityRef: EntityReferenceDTO;
  conflictType: 'update-update' | 'update-delete' | 'delete-update';
  status: ConflictStatus;
  autoResolvable: boolean;
  summary: string;
  conflictedFields: string[];

  toClientDTO(): SyncConflictClientDTO;
}

export interface SyncConflictClientStatic {
  fromClientDTO(dto: SyncConflictClientDTO): SyncConflictClient;
}
