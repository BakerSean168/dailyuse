/**
 * CompletionRecord Value Object Interface
 * 完成记录值对象 - 接口
 */

import type { DomainDate, TransferDate } from '../../../primitives';


// ============ 接口定义 ============

export interface CompletionRecord {
  completedAt: DomainDate;
  actualDuration: number | null;
  note: string | null;
  rating: number | null;

}

// ============ DTO 定义 ============

export interface CompletionRecordDTO {
  completedAt: TransferDate;
  actualDuration: number | null;
  note: string | null;
  rating: number | null;
}

