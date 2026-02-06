/**
 * GoalRecord Entity - Server Interface
 * 目标记录实体 - 服务端接口
 * 
 * 【同步支持】
 * - deletedAt: 软删除时间戳
 * - version: 乐观锁版本号
 * - updatedAt: 最后更新时间（增量同步）
 */

import type { TransferDate, PersistenceDate, DomainDate, GoalRecordId, KeyResultId } from '@/primitives';

// ============ DTO 定义 ============

/**
 * GoalRecord Server DTO
 * 记录本次的独立值，而不是累计值
 */
export interface GoalRecordServerDTO {
  id: GoalRecordId;
  keyResultId: KeyResultId;
  value: number;  // 本次记录的值（独立值）
  note: string | null;
  recordedAt: TransferDate;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}

/**
 * GoalRecord Persistence DTO
 * 数据库存储格式
 */
export interface GoalRecordPersistenceDTO {
  id: GoalRecordId;
  keyResultId: KeyResultId;
  value: number;  // 本次记录的值（独立值）
  note: string | null;
  recordedAt: PersistenceDate;
  version: number;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
  deletedAt: PersistenceDate | null;
}

// ============ 实体接口 ============

export interface GoalRecordServer {
  id: GoalRecordId;
  keyResultId: KeyResultId;
  value: number;  // 本次记录的值（独立值）
  note: string | null;
  recordedAt: DomainDate;
  version: number;
  createdAt: DomainDate;
  updatedAt: DomainDate;
  deletedAt: DomainDate | null;
}
