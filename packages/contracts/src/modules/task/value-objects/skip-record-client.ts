/**
 * SkipRecord Value Object - Client Interface
 * 跳过记录值对�?- 客户端接�?
 */

import type { DomainDate, TransferDate } from '@/primitives';
import type { SkipRecordServerDTO } from './skip-record-server';

// ============ 接口定义 ============

export interface SkipRecordClient {
  skippedAt: DomainDate;
  reason: string | null;

  // UI 辅助属�?
  formattedSkippedAt: string;
  hasReason: boolean;
  displayText: string;

  equals(other: SkipRecordClient): boolean;
}

// ============ DTO 定义 ============

export interface SkipRecordClientDTO {
  skippedAt: TransferDate;
  reason: string | null;
  formattedSkippedAt: string;
  hasReason: boolean;
  displayText: string;
}
