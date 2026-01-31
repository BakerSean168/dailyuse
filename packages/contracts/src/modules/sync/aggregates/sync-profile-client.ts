/**
 * Sync Profile Aggregate Root - Client Interface
 * 同步配置聚合根（客户端）
 */

import type { SyncProfileId, TransferDate } from '@/primitives';
import type { SyncProviderType } from '../value-objects/sync-provider-type';
import type { SyncProfileConfigDTO } from '../value-objects';

// ============ DTO 定义 ============

export interface SyncProfileClientDTO {
  id: string;
  name: string;
  description: string | null;
  providerType: SyncProviderType;
  providerSummary: {
    type: SyncProviderType;
    identifier?: string;
    serverUrl?: string;
  };
  syncConfig: SyncProfileConfigDTO;
  isDefault: boolean;
  isActive: boolean;
  isConnected: boolean;
  lastSyncAt: TransferDate | null;
  lastSyncResult: 'success' | 'failed' | 'partial' | null;
  statusLabel: string;
  nextAutoSyncAt: TransferDate | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

// ============ 接口定义 ============

export interface SyncProfileClient {
  id: SyncProfileId;
  name: string;
  providerType: SyncProviderType;
  isDefault: boolean;
  isActive: boolean;
  isConnected: boolean;
  statusLabel: string;

  canSync(): boolean;
}
