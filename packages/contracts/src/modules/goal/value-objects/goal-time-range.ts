/**
 * Goal Time Range Value Object Contracts
 * 目标时间范围值对象契约
 *
 * 注意：Contracts 包只包含纯类型定义，不包含业务逻辑或方法
 */

import type { DomainDate, TransferDate, PersistenceDate } from '@/primitives';

// ============ Domain Shape (领域层) ============

/**
 * 目标时间范围 - Domain Shape
 * 给 domain-shared 中的 Class 实现用
 */
export interface GoalTimeRange {
  startDate: DomainDate | null;
  targetDate: DomainDate | null;
  completedAt: DomainDate | null;
  archivedAt: DomainDate | null;
}

// ============ Transfer DTO (传输层) ============

/**
 * Goal Time Range DTO
 * API 传输用
 */
export interface GoalTimeRangeDTO {
  startDate: TransferDate | null; 
  targetDate: TransferDate | null; 
  completedAt: TransferDate | null; 
  archivedAt: TransferDate | null; 
}

// ============ Persistence DTO (持久化层) ============

/**
 * Goal Time Range Persistence DTO
 * 数据库存储用
 */
export interface GoalTimeRangePersistenceDTO {
  startDate: PersistenceDate | null;
  targetDate: PersistenceDate | null;
  completedAt: PersistenceDate | null;
  archivedAt: PersistenceDate | null;
}
