/**
 * CompletionRecord Value Object - Server Interface
 * 完成记录值对�?- 服务端接�?
 */

import type { TaskInstanceId, DomainDate, TransferDate, PersistenceDate } from '@/primitives';
import type { CompletionRecordClientDTO } from './completion-record-client';

// ============ 接口定义 ============

export interface CompletionRecordServer {
  completedAt: DomainDate;
  actualDuration: number | null;
  note: string | null;
  rating: number | null;

  equals(other: CompletionRecordServer): boolean;
}

// ============ DTO 定义 ============

export interface CompletionRecordServerDTO {
  completedAt: TransferDate;
  actualDuration: number | null;
  note: string | null;
  rating: number | null;
}

export interface CompletionRecordPersistenceDTO {
  taskId: string;
  completedAt: PersistenceDate;
  completionStatus: string;
  actualDuration: number | null;
  note: string | null;
  rating: number | null;
}
