/**
 * ISyncConflictRepository 仓储接口
 */

import type { SyncConflict } from '../entities/sync-conflict';
import type { SyncableEntityType, ConflictStatus } from '@dailyuse/contracts/sync';

type ConflictType = 'update-update' | 'update-delete' | 'delete-update';

export interface SyncConflictQueryOptions {
  sessionId?: string;
  entityType?: SyncableEntityType;
  status?: ConflictStatus;
  conflictType?: ConflictType;
  autoResolvable?: boolean;
  limit?: number;
  offset?: number;
}

export interface ISyncConflictRepository {
  save(conflict: SyncConflict): Promise<void>;
  saveMany(conflicts: SyncConflict[]): Promise<void>;
  findByUuid(uuid: string): Promise<SyncConflict | null>;
  findBySessionId(accountUuid: string, sessionId: string): Promise<SyncConflict[]>;
  findUnresolved(accountUuid: string, sessionId?: string): Promise<SyncConflict[]>;
  findAutoResolvable(accountUuid: string, sessionId: string): Promise<SyncConflict[]>;
  findByQuery(accountUuid: string, options: SyncConflictQueryOptions): Promise<SyncConflict[]>;
  count(accountUuid: string, options?: SyncConflictQueryOptions): Promise<number>;
  delete(uuid: string): Promise<void>;
  deleteBySessionId(accountUuid: string, sessionId: string): Promise<number>;
}
