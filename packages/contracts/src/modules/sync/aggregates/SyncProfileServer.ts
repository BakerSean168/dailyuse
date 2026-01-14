/**
 * Sync Profile Aggregate Root - Server Interface
 * 同步配置聚合根
 */

import type { SyncProviderType } from '../enums';
import type { SyncVersionServerDTO, SyncProfileConfigDTO, SyncProviderConfigDTO } from '../value-objects';
import type { SyncProfileClientDTO } from './SyncProfileClient';

// ============ DTO 定义 ============

export interface SyncProfileServerDTO {
  uuid: string;
  name: string;
  description?: string | null;
  providerType: SyncProviderType;
  providerConfig: SyncProviderConfigDTO;
  syncConfig: SyncProfileConfigDTO;
  isDefault: boolean;
  isActive: boolean;
  isConnected: boolean;
  lastSyncAt?: number | null;
  lastSyncVersion?: SyncVersionServerDTO | null;
  lastSyncResult?: 'success' | 'failed' | 'partial' | null;
  historyStats: {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    averageDurationMs: number;
  };
  createdAt: number;
  updatedAt: number;
}

export interface SyncProfilePersistenceDTO {
  uuid: string;
  name: string;
  description: string | null;
  providerType: string;
  providerConfigJson: string;
  syncConfigJson: string;
  isDefault: boolean;
  isActive: boolean;
  isConnected: boolean;
  lastSyncAt: number | null;
  lastSyncVersionJson: string | null;
  lastSyncResult: string | null;
  historyStatsJson: string;
  createdAt: number;
  updatedAt: number;
}

// ============ 领域事件 ============

export interface SyncProfileCreatedDomainEvent {
  type: 'sync.profile.created';
  aggregateId: string;
  timestamp: number;
  payload: { profile: SyncProfileServerDTO };
}

export interface SyncProfileConnectedDomainEvent {
  type: 'sync.profile.connected';
  aggregateId: string;
  timestamp: number;
  payload: { providerType: SyncProviderType };
}

// ============ 接口定义 ============

export interface SyncProfileServer {
  uuid: string;
  name: string;
  description?: string | null;
  providerType: SyncProviderType;
  providerConfig: SyncProviderConfigDTO;
  syncConfig: SyncProfileConfigDTO;
  isDefault: boolean;
  isActive: boolean;
  isConnected: boolean;
  lastSyncAt?: number | null;
  lastSyncVersion?: SyncVersionServerDTO | null;
  lastSyncResult?: 'success' | 'failed' | 'partial' | null;
  historyStats: {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    averageDurationMs: number;
  };
  createdAt: number;
  updatedAt: number;

  // 配置管理
  updateName(name: string): void;
  updateDescription(description: string): void;
  updateSyncConfig(config: Partial<SyncProfileConfigDTO>): void;
  updateProviderConfig(config: Partial<SyncProviderConfigDTO>): void;

  // 状态管理
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

  toServerDTO(): SyncProfileServerDTO;
  toClientDTO(): SyncProfileClientDTO;
  toPersistenceDTO(): SyncProfilePersistenceDTO;
}

export interface SyncProfileServerStatic {
  create(params: {
    name: string;
    description?: string;
    providerType: SyncProviderType;
    providerConfig: SyncProviderConfigDTO;
    syncConfig: SyncProfileConfigDTO;
  }): SyncProfileServer;
  fromServerDTO(dto: SyncProfileServerDTO): SyncProfileServer;
  fromPersistenceDTO(dto: SyncProfilePersistenceDTO): SyncProfileServer;
}
