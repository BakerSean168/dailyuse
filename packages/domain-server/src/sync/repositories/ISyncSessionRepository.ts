/**
 * ISyncSessionRepository 仓储接口
 */

import type { SyncSession } from '../aggregates/sync-session';
import type { SyncSessionStatus } from '@dailyuse/contracts/sync';

export interface SyncSessionQueryOptions {
  profileId?: string;
  status?: SyncSessionStatus[];
  limit?: number;
  offset?: number;
}

export interface ISyncSessionRepository {
  save(session: SyncSession): Promise<void>;
  findByUuid(uuid: string): Promise<SyncSession | null>;
  findLatestByProfileId(profileId: string): Promise<SyncSession | null>;
  findInProgress(accountUuid: string): Promise<SyncSession[]>;
  findByQuery(accountUuid: string, options: SyncSessionQueryOptions): Promise<SyncSession[]>;
  count(accountUuid: string, options?: SyncSessionQueryOptions): Promise<number>;
  delete(uuid: string): Promise<void>;
}
