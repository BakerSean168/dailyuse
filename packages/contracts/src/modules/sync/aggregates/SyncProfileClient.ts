/**
 * Sync Profile Aggregate Root - Client Interface
 * 同步配置聚合根（客户端）
 */

import type { SyncProviderType } from '../enums';
import type { SyncProfileConfigDTO } from '../value-objects';

// ============ DTO 定义 ============

export interface SyncProfileClientDTO {
  uuid: string;
  name: string;
  description?: string | null;
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
  lastSyncAt?: number | null;
  lastSyncResult?: 'success' | 'failed' | 'partial' | null;
  statusLabel: string;
  nextAutoSyncAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

// ============ 接口定义 ============

export interface SyncProfileClient {
  uuid: string;
  name: string;
  providerType: SyncProviderType;
  isDefault: boolean;
  isActive: boolean;
  isConnected: boolean;
  statusLabel: string;

  canSync(): boolean;}
