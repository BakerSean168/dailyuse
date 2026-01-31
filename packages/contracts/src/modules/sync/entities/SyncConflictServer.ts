/**
 * Sync Conflict Entity - Server Interface
 * 同步冲突实体
 */

import type { ConflictStatus } from '../enums';
import type { EntityReferenceDTO, SyncVersionServerDTO, ConflictResolutionDTO } from '../value-objects';
import type { SyncConflictClientDTO } from './SyncConflictClient';

// ============ DTO 定义 ============

export interface SyncConflictServerDTO {
  uuid: string;
  sessionId: string;
  entityRef: EntityReferenceDTO;
  conflictType: 'update-update' | 'update-delete' | 'delete-update';
  localVersion: SyncVersionServerDTO;
  localData: unknown;
  remoteVersion: SyncVersionServerDTO;
  remoteData: unknown;
  status: ConflictStatus;
  autoResolvable: boolean;
  resolution?: ConflictResolutionDTO | null;
  createdAt: number;
  updatedAt: number;
}

export interface SyncConflictPersistenceDTO {
  uuid: string;
  sessionId: string;
  entityType: string;
  entityUuid: string;
  entityName: string | null;
  conflictType: string;
  localVersionJson: string;
  localDataJson: string;
  remoteVersionJson: string;
  remoteDataJson: string;
  status: string;
  autoResolvable: boolean;
  resolutionJson: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============ 接口定义 ============

export interface SyncConflictServer {
  uuid: string;
  sessionId: string;
  entityRef: EntityReferenceDTO;
  conflictType: 'update-update' | 'update-delete' | 'delete-update';
  localVersion: SyncVersionServerDTO;
  localData: unknown;
  remoteVersion: SyncVersionServerDTO;
  remoteData: unknown;
  status: ConflictStatus;
  autoResolvable: boolean;
  resolution?: ConflictResolutionDTO | null;
  createdAt: Date;
  updatedAt: Date;

  resolve(resolution: ConflictResolutionDTO): void;
  ignore(): void;
  canAutoResolve(): boolean;}
