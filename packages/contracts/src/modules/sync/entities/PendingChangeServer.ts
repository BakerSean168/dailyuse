/**
 * Pending Change Entity - Server Interface
 * 待同步变更实体
 */

import type { ChangeOperationType } from '../enums';
import type { EntityReferenceDTO, SyncVersionServerDTO } from '../value-objects';
import type { PendingChangeClientDTO } from './PendingChangeClient';

// ============ DTO 定义 ============

export interface PendingChangeServerDTO {
  uuid: string;
  entityRef: EntityReferenceDTO;
  operation: ChangeOperationType;
  beforeData?: unknown | null;
  afterData?: unknown | null;
  version: SyncVersionServerDTO;
  isSynced: boolean;
  syncedInSession?: string | null;
  createdAt: number;
  syncedAt?: number | null;
}

export interface PendingChangePersistenceDTO {
  uuid: string;
  entityType: string;
  entityUuid: string;
  entityName: string | null;
  operation: string;
  beforeDataJson: string | null;
  afterDataJson: string | null;
  versionJson: string;
  isSynced: boolean;
  syncedInSession: string | null;
  createdAt: Date;
  syncedAt: Date | null;
}

// ============ 接口定义 ============

export interface PendingChangeServer {
  uuid: string;
  entityRef: EntityReferenceDTO;
  operation: ChangeOperationType;
  beforeData?: unknown | null;
  afterData?: unknown | null;
  version: SyncVersionServerDTO;
  isSynced: boolean;
  syncedInSession?: string | null;
  createdAt: Date;
  syncedAt?: Date | null;

  markAsSynced(sessionId: string): void;

  toServerDTO(): PendingChangeServerDTO;
  toClientDTO(): PendingChangeClientDTO;
  toPersistenceDTO(): PendingChangePersistenceDTO;
}

export interface PendingChangeServerStatic {
  create(params: {
    entityRef: EntityReferenceDTO;
    operation: ChangeOperationType;
    beforeData?: unknown;
    afterData?: unknown;
    version: SyncVersionServerDTO;
  }): PendingChangeServer;
  fromServerDTO(dto: PendingChangeServerDTO): PendingChangeServer;
  fromPersistenceDTO(dto: PendingChangePersistenceDTO): PendingChangeServer;
}
