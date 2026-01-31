/**
 * SkipRecord Value Object - Client Interface
 * 跳过记录值对象 - 客户端接口
 */

import type { SkipRecordServerDTO } from './SkipRecordServer';

// ============ 接口定义 ============

export interface SkipRecordClient {
  skippedAt: number;
  reason?: string | null;

  // UI 辅助属性
  formattedSkippedAt: string;
  hasReason: boolean;
  displayText: string;

  equals(other: SkipRecordClient): boolean;}

// ============ DTO 定义 ============

export interface SkipRecordClientDTO {
  skippedAt: number;
  reason?: string | null;
  formattedSkippedAt: string;
  hasReason: boolean;
  displayText: string;
}
