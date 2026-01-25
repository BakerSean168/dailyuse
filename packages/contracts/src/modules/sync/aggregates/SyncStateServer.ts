/**
 * Sync State Aggregate Root - Server Interface
 * 全局同步状态聚合根（单例）
 */

import type { SyncVersionServerDTO, DeviceInfoDTO } from '../value-objects';
import type { SyncStateClientDTO } from './SyncStateClient';

// ============ DTO 定义 ============

export interface SyncStateServerDTO {
  id: 'sync-state';
  currentDevice: DeviceInfoDTO;
  activeProfileId?: string | null;
  currentSessionId?: string | null;
  globalVersion: SyncVersionServerDTO;
  pendingChangesCount: number;
  lastSyncAt?: number | null;
  isLocked: boolean;
  lockReason?: string | null;
  isOnline: boolean;
  registeredDevices: DeviceInfoDTO[];
  updatedAt: number;
}

export interface SyncStatePersistenceDTO {
  id: string;
  currentDeviceJson: string;
  activeProfileId: string | null;
  currentSessionId: string | null;
  globalVersionJson: string;
  pendingChangesCount: number;
  lastSyncAt: Date | null;
  isLocked: boolean;
  lockReason: string | null;
  isOnline: boolean;
  registeredDevicesJson: string;
  updatedAt: Date;
}

// ============ 接口定义 ============

export interface SyncStateServer {
  id: 'sync-state';
  currentDevice: DeviceInfoDTO;
  activeProfileId?: string | null;
  currentSessionId?: string | null;
  globalVersion: SyncVersionServerDTO;
  pendingChangesCount: number;
  lastSyncAt?: Date | null;
  isLocked: boolean;
  lockReason?: string | null;
  isOnline: boolean;
  registeredDevices: DeviceInfoDTO[];
  updatedAt: Date;

  // 状态管理
  setActiveProfile(profileId: string): void;
  clearActiveProfile(): void;
  startSession(sessionId: string): void;
  endSession(): void;
  
  // 锁管理
  lock(reason: string): void;
  unlock(): void;
  
  // 网络状态
  setOnline(online: boolean): void;
  
  // 版本管理
  updateGlobalVersion(version: SyncVersionServerDTO): void;
  incrementPendingChanges(): void;
  decrementPendingChanges(count?: number): void;
  
  // 设备管理
  registerDevice(device: DeviceInfoDTO): void;
  
  // 业务查询
  canStartSync(): boolean;
  isSyncing(): boolean;

  toServerDTO(): SyncStateServerDTO;
  toClientDTO(): SyncStateClientDTO;
  toPersistenceDTO(): SyncStatePersistenceDTO;
}

export interface SyncStateServerStatic {
  create(currentDevice: DeviceInfoDTO): SyncStateServer;
  fromServerDTO(dto: SyncStateServerDTO): SyncStateServer;
  fromPersistenceDTO(dto: SyncStatePersistenceDTO): SyncStateServer;
}
