/**
 * Pending Change Entity - Server Interface
 * 待同步变更实�?
 */

import type { PendingChangeId, SyncSessionId, DomainDate, PersistenceDate, TransferDate } from '@/primitives';
import type { ChangeOperationType } from '../value-objects/change-operation-type';
import type { EntityReferenceDTO, SyncVersionServerDTO } from '../value-objects';
import type { PendingChangeClientDTO } from './pending-change-client';

// ============ DTO 定义 ============

export interface PendingChangeServerDTO {
  id: string;
  entityRef: EntityReferenceDTO;
  operation: ChangeOperationType;
  beforeData: unknown | null;
  afterData: unknown | null;
  version: SyncVersionServerDTO;
  isSynced: boolean;
  syncedInSessionId: string | null;
  createdAt: TransferDate;
  syncedAt: TransferDate | null;
}

export interface PendingChangePersistenceDTO {
  id: string;
  entityType: string;
  entityId: string;
  entityName: string | null;
  operation: string;
  beforeDataJson: string | null;
  afterDataJson: string | null;
  versionJson: string;
  isSynced: boolean;
  syncedInSessionId: string | null;
  createdAt: PersistenceDate;
  syncedAt: PersistenceDate | null;
}

// ============ 接口定义 ============

export interface PendingChangeServer {
  id: PendingChangeId;
  entityRef: EntityReferenceDTO;
  operation: ChangeOperationType;
  beforeData: unknown | null;
  afterData: unknown | null;
  version: SyncVersionServerDTO;
  isSynced: boolean;
  syncedInSessionId: SyncSessionId | null;
  createdAt: DomainDate;
  syncedAt: DomainDate | null;

  markAsSynced(sessionId: SyncSessionId): void;
}
}
