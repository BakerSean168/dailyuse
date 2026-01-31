/**
 * Sync State Aggregate Root - Server Interface
 * 全局同步状态聚合根（单例）
 */

import type { SyncProfileId, SyncSessionId, DomainDate, PersistenceDate, TransferDate } from '@/primitives';
import type { SyncVersionServerDTO, DeviceInfoDTO } from '../value-objects';
import type { SyncStateClientDTO } from './sync-state-client';

// ============ DTO 定义 ============

export interface SyncStateServerDTO {
  id: 'sync-state';
  currentDevice: DeviceInfoDTO;
  activeProfileId: string | null;
  currentSessionId: string | null;
  globalVersion: SyncVersionServerDTO;
  pendingChangesCount: number;
  lastSyncAt: TransferDate | null;
  isLocked: boolean;
  lockReason: string | null;
  isOnline: boolean;
  registeredDevices: DeviceInfoDTO[];
  updatedAt: TransferDate;
}

export interface SyncStatePersistenceDTO {
  id: string;
  currentDeviceJson: string;
  activeProfileId: string | null;
  currentSessionId: string | null;
  globalVersionJson: string;
  pendingChangesCount: number;
  lastSyncAt: PersistenceDate | null;
  isLocked: boolean;
  lockReason: string | null;
  isOnline: boolean;
  registeredDevicesJson: string;
  updatedAt: PersistenceDate;
}

// ============ 接口定义 ============

export interface SyncStateServer {
  id: 'sync-state';
  currentDevice: DeviceInfoDTO;
  activeProfileId: SyncProfileId | null;
  currentSessionId: SyncSessionId | null;
  globalVersion: SyncVersionServerDTO;
  pendingChangesCount: number;
  lastSyncAt: DomainDate | null;
  isLocked: boolean;
  lockReason: string | null;
  isOnline: boolean;
  registeredDevices: DeviceInfoDTO[];
  updatedAt: DomainDate;

}
