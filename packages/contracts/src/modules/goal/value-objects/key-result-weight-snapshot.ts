/**
 * Key Result Weight Snapshot Value Object Contracts
 * 关键成果权重快照值对象契约
 *
 * 用于记录 KeyResult 权重的历史变更，支持权重调整的完整追溯和审计。
 * 注意：Contracts 包只包含纯类型定义，不包含业务逻辑或方法
 */

import type {
  DomainDate,
  TransferDate,
  PersistenceDate,
  KeyResultWeightSnapshotId,
  GoalId,
  KeyResultId,
  IdentityId,
} from '@/primitives';

// ============ 枚举定义 ============

/**
 * 权重快照触发方式
 */
export const SnapshotTrigger = {
  MANUAL: 'manual', // 用户手动调整
  AUTO: 'auto', // 系统自动调整
  RESTORE: 'restore', // 恢复历史快照
  IMPORT: 'import', // 从外部导入
} as const;

export type SnapshotTrigger = (typeof SnapshotTrigger)[keyof typeof SnapshotTrigger];

// ============ Domain Shape (领域层) ============

/**
 * 关键成果权重快照 - Domain Shape
 * 给 domain-shared 中的 Class 实现用
 */
export interface KeyResultWeightSnapshot {
  id: KeyResultWeightSnapshotId;
  goalId: GoalId;
  keyResultId: KeyResultId;
  oldWeight: number;
  newWeight: number;
  weightDelta: number;
  snapshotTime: DomainDate;
  trigger: SnapshotTrigger;
  reason: string | null;
  operatorId: IdentityId;
  createdAt: DomainDate;
}

// ============ Transfer DTO (传输层) ============

/**
 * Key Result Weight Snapshot DTO
 * API 传输用
 */
export interface KeyResultWeightSnapshotDTO {
  id: KeyResultWeightSnapshotId;
  goalId: GoalId;
  keyResultId: KeyResultId;
  oldWeight: number;
  newWeight: number;
  weightDelta: number;
  snapshotTime: TransferDate;
  trigger: SnapshotTrigger;
  reason: string | null;
  operatorId: IdentityId;
  createdAt: TransferDate;
}

// ============ Persistence DTO (持久化层) ============

/**
 * Key Result Weight Snapshot Persistence DTO
 * 数据库存储用
 */
export interface KeyResultWeightSnapshotPersistenceDTO {
  id: KeyResultWeightSnapshotId;
  goalId: GoalId;
  keyResultId: KeyResultId;
  oldWeight: number;
  newWeight: number;
  weightDelta: number;
  snapshotTime: PersistenceDate;
  trigger: string;
  reason: string | null;
  operatorId: IdentityId;
  createdAt: PersistenceDate;
}
