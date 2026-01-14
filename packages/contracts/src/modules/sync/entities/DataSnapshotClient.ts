/**
 * Data Snapshot Entity - Client Interface
 * 数据快照实体（客户端）
 */

import type { SyncableEntityType } from '../enums';
import type { SyncVersionClientDTO } from '../value-objects';

// ============ DTO 定义 ============

export interface DataSnapshotClientDTO {
  uuid: string;
  sessionId: string;
  snapshotType: 'full' | 'incremental';
  source: 'local' | 'remote';
  version: SyncVersionClientDTO;
  checksum: string;
  entityTypes: SyncableEntityType[];
  entityCounts: Record<string, number>;
  compressedSize: number;
  rawSize: number;
  createdAt: number;
  isDataLoaded: boolean;
}

// ============ 接口定义 ============

export interface DataSnapshotClient {
  uuid: string;
  sessionId: string;
  snapshotType: 'full' | 'incremental';
  source: 'local' | 'remote';
  entityTypes: SyncableEntityType[];
  entityCounts: Record<string, number>;
  isDataLoaded: boolean;

  toClientDTO(): DataSnapshotClientDTO;
}

export interface DataSnapshotClientStatic {
  fromClientDTO(dto: DataSnapshotClientDTO): DataSnapshotClient;
}
