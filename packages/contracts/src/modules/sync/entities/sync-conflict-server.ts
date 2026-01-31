/**
 * Sync Conflict Entity - Server Interface
 * 同步冲突实体
 */

import type { SyncConflictId, SyncSessionId, DomainDate, PersistenceDate, TransferDate } from '@/primitives';
import type { ConflictStatus } from '../value-objects/conflict-status';
import type { EntityReferenceDTO, SyncVersionServerDTO, ConflictResolutionDTO } from '../value-objects';
import type { SyncConflictClientDTO } from './sync-conflict-client';

// ============ DTO 定义 ============

export interface SyncConflictServerDTO {
  id: string;
  sessionId: string;
  entityRef: EntityReferenceDTO;
  conflictType: 'update-update' | 'update-delete' | 'delete-update';
  localVersion: SyncVersionServerDTO;
  localData: unknown;
  remoteVersion: SyncVersionServerDTO;
  remoteData: unknown;
  status: ConflictStatus;
  autoResolvable: boolean;
  resolution: ConflictResolutionDTO | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

export interface SyncConflictPersistenceDTO {
  id: string;
  sessionId: string;
  entityType: string;
  entityId: string;
  entityName: string | null;
  conflictType: string;
  localVersionJson: string;
  localDataJson: string;
  remoteVersionJson: string;
  remoteDataJson: string;
  status: string;
  autoResolvable: boolean;
  resolutionJson: string | null;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}

// ============ 接口定义 ============

export interface SyncConflictServer {
  id: SyncConflictId;
  sessionId: SyncSessionId;
  entityRef: EntityReferenceDTO;
  conflictType: 'update-update' | 'update-delete' | 'delete-update';
  localVersion: SyncVersionServerDTO;
  localData: unknown;
  remoteVersion: SyncVersionServerDTO;
  remoteData: unknown;
  status: ConflictStatus;
  autoResolvable: boolean;
  resolution: ConflictResolutionDTO | null;
  createdAt: DomainDate;
  updatedAt: DomainDate;
}
