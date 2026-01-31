/**
 * GoalRecord Entity - Client Interface
 */

import type { DomainDate, TransferDate } from '@/primitives';


export interface GoalRecordClientDTO {
  id: string;
  keyResultId: string;
  goalId: string;
  value: number;  // 本次记录的值（独立值）
  valueAfter: number;   // 改变后的快照值
  comment: string | null;
  createdAt: TransferDate;
}

export interface GoalRecordClient {
  id: string;
  keyResultId: string;
  goalId: string;
  value: number;  // 本次记录的值（独立值）
  valueAfter: number;   // 改变后的快照值
  comment: string | null;
  createdAt: DomainDate;
}
