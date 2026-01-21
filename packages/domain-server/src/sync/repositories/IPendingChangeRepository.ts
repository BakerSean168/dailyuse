/**
 * IPendingChangeRepository 仓储接口
 */

import type { PendingChange } from '../entities/PendingChange';
import type { SyncableEntityType, ChangeOperationType } from '@dailyuse/contracts/sync';

export interface PendingChangeQueryOptions {
  entityType?: SyncableEntityType;
  entityUuid?: string;
  operation?: ChangeOperationType;
  isSynced?: boolean;
  limit?: number;
  offset?: number;
}

export interface IPendingChangeRepository {
  save(change: PendingChange): Promise<void>;
  saveMany(changes: PendingChange[]): Promise<void>;
  findByUuid(uuid: string): Promise<PendingChange | null>;
  findUnsyncedByEntityRef(accountUuid: string, entityType: SyncableEntityType, entityUuid: string): Promise<PendingChange[]>;
  findAllUnsynced(accountUuid: string, limit?: number): Promise<PendingChange[]>;
  findByQuery(accountUuid: string, options: PendingChangeQueryOptions): Promise<PendingChange[]>;
  count(accountUuid: string, options?: PendingChangeQueryOptions): Promise<number>;
  delete(uuid: string): Promise<void>;
  deleteMany(uuids: string[]): Promise<void>;
  deleteSynced(accountUuid: string): Promise<number>;
}
