/**
 * Key Result Snapshot Value Object Contracts
 * 关键成果快照值对象契约（用于复盘记录）
 *
 * 注意：Contracts 包只包含纯类型定义，不包含业务逻辑或方法
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
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

// Residual 737: KeyResultSnapshotDTO dual body retired — OpenAPI + transport use
// KeyResultSnapshotDTOSchema (semantic type is a z.infer alias).

export const KeyResultSnapshotDTOSchema = z.object({
  keyResultId: brandedId<KeyResultId>(),
  title: z.string(),
  targetValue: z.number(),
  currentValue: z.number(),
  progressPercentage: z.number(),
});

export type KeyResultSnapshotDTO = z.infer<typeof KeyResultSnapshotDTOSchema>;
