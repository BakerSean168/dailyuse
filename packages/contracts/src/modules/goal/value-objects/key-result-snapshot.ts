/**
 * Key Result Snapshot Value Object Contracts
 * 关键成果快照值对象契约（用于复盘记录）
 *
 * 注意：Contracts 包只包含纯类型定义，不包含业务逻辑或方法
 */

import type { KeyResultId } from '../../../primitives';

// ============ Domain Shape (领域层) ============

/**
 * 关键成果快照 - Domain Shape
 * 给 domain-shared 中的 Class 实现用
 */
export interface KeyResultSnapshot {
  keyResultId: KeyResultId;
  title: string;
  targetValue: number;
  currentValue: number;
  progressPercentage: number;
}

// ============ Transfer DTO (传输层) ============

/**
 * Key Result Snapshot DTO
 * API 传输用
 */
export interface KeyResultSnapshotDTO {
  keyResultId: KeyResultId;
  title: string;
  targetValue: number;
  currentValue: number;
  progressPercentage: number;
}

// ============ Persistence DTO (持久化层) ============

/**
 * Key Result Snapshot Persistence DTO
 * 数据库存储用
 */
export interface KeyResultSnapshotPersistenceDTO {
  keyResultId: KeyResultId;
  title: string;
  targetValue: number;
  currentValue: number;
  progressPercentage: number;
}
