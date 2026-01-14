/**
 * ISyncSessionRepository 仓储接口
 */

import type { SyncSession } from '../aggregates/SyncSession';
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
  findInProgress(): Promise<SyncSession[]>;
  findByQuery(options: SyncSessionQueryOptions): Promise<SyncSession[]>;
  count(options?: SyncSessionQueryOptions): Promise<number>;
  delete(uuid: string): Promise<void>;
}
