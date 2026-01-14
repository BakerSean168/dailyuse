/**
 * Sync Version Value Object
 * 同步版本（向量时钟）值对象
 */

// ============ DTO 定义 ============

/**
 * 设备版本条目
 */
export interface DeviceVersionEntry {
  deviceId: string;
  deviceName?: string;
  version: number;
  updatedAt: number;
}

/**
 * Sync Version Server DTO
 */
export interface SyncVersionServerDTO {
  logicalVersion: number;
  vectorClock: DeviceVersionEntry[];
  lastModifiedBy: string;
  lastModifiedAt: number;
}

/**
 * Sync Version Client DTO
 */
export type SyncVersionClientDTO = SyncVersionServerDTO;

/**
 * Sync Version Persistence DTO
 */
export interface SyncVersionPersistenceDTO {
  logicalVersion: number;
  vectorClockJson: string;
  lastModifiedBy: string;
  lastModifiedAt: number;
}

// ============ 接口定义 ============

export interface ISyncVersionServer {
  logicalVersion: number;
  vectorClock: DeviceVersionEntry[];
  lastModifiedBy: string;
  lastModifiedAt: number;

  equals(other: ISyncVersionServer): boolean;
  increment(deviceId: string): ISyncVersionServer;
  merge(other: ISyncVersionServer): ISyncVersionServer;
  happenedBefore(other: ISyncVersionServer): boolean;
  isConflict(other: ISyncVersionServer): boolean;

  toServerDTO(): SyncVersionServerDTO;
  toClientDTO(): SyncVersionClientDTO;
  toPersistenceDTO(): SyncVersionPersistenceDTO;
}

export interface ISyncVersionServerStatic {
  create(deviceId: string): ISyncVersionServer;
  fromServerDTO(dto: SyncVersionServerDTO): ISyncVersionServer;
  fromPersistenceDTO(dto: SyncVersionPersistenceDTO): ISyncVersionServer;
}
