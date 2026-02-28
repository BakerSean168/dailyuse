/**
 * KeyResult Entity - Server Interface
 *
 * 【同步支持】
 * - deletedAt: 软删除时间戳
 * - version: 乐观锁版本号
 * - updatedAt: 最后更新时间（增量同步）
 */

import type { KeyResultProgressDTO } from '../value-objects';
import type { TransferDate, PersistenceDate, DomainDate, KeyResultId } from '@/primitives';

export interface KeyResultServerDTO {
  id: KeyResultId;
  title: string;
  description: string | null;
  progress: KeyResultProgressDTO;
  weight: number; // 权重 (1-5)
  sortOrder: number; // 排序位置
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}

/**
 * KeyResult Persistence DTO
 * 数据库存储格式
 */
export interface KeyResultPersistenceDTO {
  id: KeyResultId;
  goalId: string; // 所属目标 ID
  title: string;
  description: string | null;
  progress: string; // JSON string (KeyResultProgressDTO)
  weight: number; // 权重 (1-5)
  sortOrder: number;
  version: number;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
  deletedAt: PersistenceDate | null;
}
