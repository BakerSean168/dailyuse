/**
 * ISyncProfileRepository 仓储接口
 */

import type { SyncProfile } from '../aggregates/sync-profile';
import type { SyncProviderType } from '@dailyuse/contracts/sync';

export interface SyncProfileQueryOptions {
  providerType?: SyncProviderType;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface ISyncProfileRepository {
  save(profile: SyncProfile): Promise<void>;
  findByUuid(uuid: string): Promise<SyncProfile | null>;
  findDefault(accountUuid: string): Promise<SyncProfile | null>;
  findAll(accountUuid: string): Promise<SyncProfile[]>;
  findActive(accountUuid: string): Promise<SyncProfile[]>;
  findByQuery(accountUuid: string, options: SyncProfileQueryOptions): Promise<SyncProfile[]>;
  count(accountUuid: string, options?: SyncProfileQueryOptions): Promise<number>;
  delete(uuid: string): Promise<void>;
  existsByName(accountUuid: string, name: string, excludeUuid?: string): Promise<boolean>;
}
