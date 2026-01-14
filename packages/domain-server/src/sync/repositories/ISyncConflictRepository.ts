/**
 * ISyncConflictRepository 仓储接口
 */

import type { SyncConflict } from '../entities/SyncConflict';
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
  findBySessionId(sessionId: string): Promise<SyncConflict[]>;
  findUnresolved(sessionId?: string): Promise<SyncConflict[]>;
  findAutoResolvable(sessionId: string): Promise<SyncConflict[]>;
  findByQuery(options: SyncConflictQueryOptions): Promise<SyncConflict[]>;
  count(options?: SyncConflictQueryOptions): Promise<number>;
  delete(uuid: string): Promise<void>;
  deleteBySessionId(sessionId: string): Promise<number>;
}
