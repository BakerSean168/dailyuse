/**
 * CompletionRecord Value Object - Server Interface
 * 完成记录值对象 - 服务端接口
 */

import type { CompletionRecordClientDTO } from './CompletionRecordClient';

// ============ 接口定义 ============

export interface CompletionRecordServer {
  completedAt: Date;
  actualDuration?: number | null;
  note?: string | null;
  rating?: number | null;

  equals(other: CompletionRecordServer): boolean;}

// ============ DTO 定义 ============

export interface CompletionRecordServerDTO {
  completedAt: number;
  actualDuration?: number | null;
  note?: string | null;
  rating?: number | null;
}

export interface CompletionRecordPersistenceDTO {
  taskUuid: string;
  completedAt: Date;
  completionStatus: string;
  actualDuration?: number | null;
  note?: string | null;
  rating?: number | null;
}
