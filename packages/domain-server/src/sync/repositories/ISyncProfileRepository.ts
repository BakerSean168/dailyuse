/**
 * ISyncProfileRepository 仓储接口
 */

import type { SyncProfile } from '../aggregates/SyncProfile';
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
  findDefault(): Promise<SyncProfile | null>;
  findAll(): Promise<SyncProfile[]>;
  findActive(): Promise<SyncProfile[]>;
  findByQuery(options: SyncProfileQueryOptions): Promise<SyncProfile[]>;
  count(options?: SyncProfileQueryOptions): Promise<number>;
  delete(uuid: string): Promise<void>;
  existsByName(name: string, excludeUuid?: string): Promise<boolean>;
}
