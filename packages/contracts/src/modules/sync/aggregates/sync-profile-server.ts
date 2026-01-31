/**
 * Sync Profile Aggregate Root - Server Interface
 * 同步配置聚合�?
 */

import type { SyncProfileId, DomainDate, PersistenceDate } from '@/primitives';
import type { SyncProviderType } from '../value-objects/sync-provider-type';
import type { SyncVersionServerDTO, SyncProfileConfigDTO, SyncProviderConfigDTO } from '../value-objects';
import type { SyncProfileClientDTO } from './sync-profile-client';

// ============ DTO 定义 ============

export interface SyncProfileServerDTO {
  id: string;
  name: string;
  description: string | null;
  providerType: SyncProviderType;
  providerConfig: SyncProviderConfigDTO;
  syncConfig: SyncProfileConfigDTO;
  isDefault: boolean;
  isActive: boolean;
  isConnected: boolean;
  lastSyncAt: number | null;
  lastSyncVersion: SyncVersionServerDTO | null;
  lastSyncResult: 'success' | 'failed' | 'partial' | null;
  historyStats: {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    averageDurationMs: number;
  };
  createdAt: DomainDate;
  updatedAt: DomainDate;
}

export interface SyncProfilePersistenceDTO {
  id: string;
  name: string;
  description: string | null;
  providerType: string;
  providerConfigJson: string;
  syncConfigJson: string;
  isDefault: boolean;
  isActive: boolean;
  isConnected: boolean;
  lastSyncAt: Date | null;
  lastSyncVersionJson: string | null;
  lastSyncResult: string | null;
  historyStatsJson: string;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}

// ============ 领域事件 ============

export interface SyncProfileCreatedDomainEvent {
  type: 'sync.profile.created';
  aggregateId: SyncProfileId;
  timestamp: DomainDate;
  payload: { profile: SyncProfileServerDTO };
}

export interface SyncProfileConnectedDomainEvent {
  type: 'sync.profile.connected';
  aggregateId: SyncProfileId;
  timestamp: DomainDate;
  payload: { providerType: SyncProviderType };
}

// ============ 接口定义 ============

export interface SyncProfileServer {
  id: SyncProfileId;
  name: string;
  description: string | null;
  providerType: SyncProviderType;
  providerConfig: SyncProviderConfigDTO;
  syncConfig: SyncProfileConfigDTO;
  isDefault: boolean;
  isActive: boolean;
  isConnected: boolean;
  lastSyncAt: DomainDate | null;
  lastSyncVersion: SyncVersionServerDTO | null;
  lastSyncResult: 'success' | 'failed' | 'partial' | null;
  historyStats: {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    averageDurationMs: number;
  };
  createdAt: DomainDate;
  updatedAt: DomainDate;

  // 配置管理
  updateName(name: string): void;
  updateDescription(description: string): void;
  updateSyncConfig(config: Partial<SyncProfileConfigDTO>): void;
  updateProviderConfig(config: Partial<SyncProviderConfigDTO>): void;

  // 状态管�?
  activate(): void;
  deactivate(): void;
  setAsDefault(): void;
  markConnected(): void;
  markDisconnected(): void;

  // 同步记录
  recordSyncResult(result: 'success' | 'failed' | 'partial', durationMs: number): void;
  updateLastSyncVersion(version: SyncVersionServerDTO): void;

  // 业务查询
  canSync(): boolean;
  needsReconnect(): boolean;
}
}
