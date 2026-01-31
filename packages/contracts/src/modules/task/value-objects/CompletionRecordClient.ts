/**
 * CompletionRecord Value Object - Client Interface
 * 完成记录值对象 - 客户端接口
 */

import type { CompletionRecordServerDTO } from './CompletionRecordServer';

// ============ 接口定义 ============

export interface CompletionRecordClient {
  completedAt: Date;
  actualDuration?: number | null;
  note?: string | null;
  rating?: number | null;

  // UI 辅助属性
  formattedCompletedAt: string;
  durationText: string;
  hasNote: boolean;
  hasRating: boolean;
  ratingStars: string;

  equals(other: CompletionRecordClient): boolean;}

// ============ DTO 定义 ============

export interface CompletionRecordClientDTO {
  completedAt: number;
  actualDuration?: number | null;
  note?: string | null;
  rating?: number | null;
  formattedCompletedAt: string;
  durationText: string;
  hasNote: boolean;
  hasRating: boolean;
  ratingStars: string;
}
