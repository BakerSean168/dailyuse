/**
 * CompletionRecord Value Object - Client Interface
 * 完成记录值对�?- 客户端接�?
 */

import type { DomainDate, TransferDate } from '@/primitives';
import type { CompletionRecordServerDTO } from './completion-record-server';

// ============ 接口定义 ============

export interface CompletionRecordClient {
  completedAt: DomainDate;
  actualDuration: number | null;
  note: string | null;
  rating: number | null;

  // UI 辅助属�?
  formattedCompletedAt: string;
  durationText: string;
  hasNote: boolean;
  hasRating: boolean;
  ratingStars: string;

  equals(other: CompletionRecordClient): boolean;
}

// ============ DTO 定义 ============

export interface CompletionRecordClientDTO {
  completedAt: TransferDate;
  actualDuration: number | null;
  note: string | null;
  rating: number | null;
  formattedCompletedAt: string;
  durationText: string;
  hasNote: boolean;
  hasRating: boolean;
  ratingStars: string;
}
