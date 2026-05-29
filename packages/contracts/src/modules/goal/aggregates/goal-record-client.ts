/**
 * GoalRecord Entity - Client Interface
 */

import type { GoalId, TransferDate } from '../../../primitives';
import type { GoalRecordId } from '../../../primitives';
import type { KeyResultId } from '../../../primitives';

export interface GoalRecordClientDTO {
  id: GoalRecordId;
  keyResultId: KeyResultId;
  goalId: GoalId;
  value: number;  // 本次记录的值（独立值）
  valueAfter: number;   // 改变后的快照值
  comment: string | null;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}
