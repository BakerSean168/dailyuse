/**
 * TaskTimeConfig Value Object - Client Interface
 * 任务时间配置值对�?- 客户端接�?
 */

import type { DomainDate, TransferDate } from '@/primitives';
import type { TimeType } from './time-type';
import type { TaskTimeConfigServerDTO } from './task-time-config-server';

// ============ 接口定义 ============

export interface TaskTimeConfigClient {
  timeType: TimeType;
  startDate: DomainDate | null;
  // endDate 已移�?- 结束日期属于重复规则，不属于时间配置
  timePoint: number | null;
  timeRange?: { start: number; end: number } | null;

  // UI 辅助属�?
  timeTypeText: string;
  formattedStartDate: string;
  // formattedEndDate 已移�?
  formattedTimePoint: string;
  formattedTimeRange: string;
  displayText: string;
  hasDateRange: boolean; // 指的�?timeRange 是否有开始和结束时间

  equals(other: TaskTimeConfigClient): boolean;
}

// ============ DTO 定义 ============

export interface TaskTimeConfigClientDTO {
  timeType: TimeType;
  startDate: TransferDate | null;
  // endDate 已移�?
  timePoint: number | null;
  timeRange?: { start: number; end: number } | null;
  timeTypeText: string;
  formattedStartDate: string;
  // formattedEndDate 已移�?
  formattedTimePoint: string;
  formattedTimeRange: string;
  displayText: string;
  hasDateRange: boolean;
}
