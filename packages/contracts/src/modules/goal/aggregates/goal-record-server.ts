/**
 * GoalRecord Entity - Server Interface
 * 目标记录实体 - 服务端接�?
 */
import type { GoalRecordId, GoalId, KeyResultId, TransferDate, DomainDate, PersistenceDate } from '@/primitives';
import type { GoalRecordClientDTO } from './goal-record-client';

// ============ DTO 定义 ============

/**
 * GoalRecord Server DTO
 * 记录本次的独立值，而不是累计
 */
export interface GoalRecordServerDTO {
  id: GoalRecordId;
  keyResultId: KeyResultId;
  goalId: GoalId;
  value: number;  // 本次记录的值（独立值）
  valueAfter: number;   // 改变后的快照值
  comment: string | null;
  createdAt: TransferDate;
}

/**
 * GoalRecord Persistence DTO
 * 注意：使用 camelCase 命名
 */
export interface GoalRecordPersistenceDTO {
  id: GoalRecordId;
  keyResultId: KeyResultId;
  goalId: GoalId;
  value: number;  // 本次记录的值（独立值）
  valueAfter: number;   // 改变后的快照
  comment: string | null;
  createdAt: PersistenceDate;
}

// ============ 实体接口 ============

export interface GoalRecordServer {
  id: GoalRecordId;
  keyResultId: KeyResultId;
  goalId: GoalId;
  value: number;  // 本次记录的值（独立值）
  valueAfter: number;   // 改变后的快照
  comment: string | null;
  createdAt: DomainDate;
}
