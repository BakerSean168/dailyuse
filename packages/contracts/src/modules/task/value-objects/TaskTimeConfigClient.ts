/**
 * TaskTimeConfig Value Object - Client Interface
 * 任务时间配置值对象 - 客户端接口
 */

import type { TimeType } from '../enums';
import type { TaskTimeConfigServerDTO } from './TaskTimeConfigServer';

// ============ 接口定义 ============

export interface TaskTimeConfigClient {
  timeType: TimeType;
  startDate?: Date | null;
  // endDate 已移除 - 结束日期属于重复规则，不属于时间配置
  timePoint?: number | null;
  timeRange?: { start: number; end: number } | null;

  // UI 辅助属性
  timeTypeText: string;
  formattedStartDate: string;
  // formattedEndDate 已移除
  formattedTimePoint: string;
  formattedTimeRange: string;
  displayText: string;
  hasDateRange: boolean; // 指的是 timeRange 是否有开始和结束时间

  equals(other: TaskTimeConfigClient): boolean;}

// ============ DTO 定义 ============

export interface TaskTimeConfigClientDTO {
  timeType: TimeType;
  startDate?: number | null;
  // endDate 已移除
  timePoint?: number | null;
  timeRange?: { start: number; end: number } | null;
  timeTypeText: string;
  formattedStartDate: string;
  // formattedEndDate 已移除
  formattedTimePoint: string;
  formattedTimeRange: string;
  displayText: string;
  hasDateRange: boolean;
}
