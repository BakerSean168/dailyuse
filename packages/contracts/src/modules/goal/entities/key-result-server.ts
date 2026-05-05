/**
 * KeyResult Entity - Server Interface
 *
 * 【同步支持】
 * - deletedAt: 软删除时间戳
 * - version: 乐观锁版本号
 * - updatedAt: 最后更新时间（增量同步）
 */

import type { KeyResultProgressDTO } from '../value-objects';
import type { TransferDate, DomainDate, KeyResultId } from '../../../primitives';

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
