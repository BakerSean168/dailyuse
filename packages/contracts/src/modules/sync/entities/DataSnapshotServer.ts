/**
 * Data Snapshot Entity - Server Interface
 * 数据快照实体
 */

import type { SyncableEntityType } from '../enums';
import type { SyncVersionServerDTO } from '../value-objects';
import type { DataSnapshotClientDTO } from './DataSnapshotClient';

// ============ DTO 定义 ============

export interface DataSnapshotServerDTO {
  uuid: string;
  sessionId: string;
  snapshotType: 'full' | 'incremental';
  source: 'local' | 'remote';
  version: SyncVersionServerDTO;
  checksum: string;
  entityTypes: SyncableEntityType[];
  entityCounts: Record<string, number>;
  compressedSize: number;
  rawSize: number;
  createdAt: number;
  data?: Record<string, unknown[]> | null;
}

export interface DataSnapshotPersistenceDTO {
  uuid: string;
  sessionId: string;
  snapshotType: string;
  source: string;
  versionJson: string;
  checksum: string;
  entityTypesJson: string;
  entityCountsJson: string;
  compressedSize: number;
  rawSize: number;
  createdAt: Date;
  dataPath: string | null;
  dataJson: string | null;
}

// ============ 接口定义 ============

export interface DataSnapshotServer {
  uuid: string;
  sessionId: string;
  snapshotType: 'full' | 'incremental';
  source: 'local' | 'remote';
  version: SyncVersionServerDTO;
  checksum: string;
  entityTypes: SyncableEntityType[];
  entityCounts: Record<string, number>;
  compressedSize: number;
  rawSize: number;
  createdAt: Date;
  data?: Record<string, unknown[]> | null;

  loadData(): Promise<void>;
  getEntityData<T>(entityType: SyncableEntityType): T[] | null;

  toServerDTO(): DataSnapshotServerDTO;
  toClientDTO(): DataSnapshotClientDTO;
  toPersistenceDTO(): DataSnapshotPersistenceDTO;
}

export interface DataSnapshotServerStatic {
  create(params: {
    sessionId: string;
    snapshotType: 'full' | 'incremental';
    source: 'local' | 'remote';
    version: SyncVersionServerDTO;
    data: Record<string, unknown[]>;
  }): DataSnapshotServer;
  fromServerDTO(dto: DataSnapshotServerDTO): DataSnapshotServer;
  fromPersistenceDTO(dto: DataSnapshotPersistenceDTO): DataSnapshotServer;
}
