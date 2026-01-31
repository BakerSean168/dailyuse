/**
 * TaskTimeConfig Value Object - Server Interface
 * 任务时间配置值对象 - 服务端接口
 */

import type { TimeType } from '../enums';
import type { TaskTimeConfigClientDTO } from './TaskTimeConfigClient';

// ============ 接口定义 ============

export interface TaskTimeConfigServer {
  timeType: TimeType;
  startDate?: Date | null;
  // endDate 已移除 - 结束日期属于重复规则的结束条件，不属于时间配置
  timePoint?: number | null;
  timeRange?: { start: number; end: number } | null;

  equals(other: TaskTimeConfigServer): boolean;}

// ============ DTO 定义 ============

export interface TaskTimeConfigServerDTO {
  timeType: TimeType;
  startDate?: number | null;
  // endDate 已移除
  timePoint?: number | null;
  timeRange?: { start: number; end: number } | null;
}

export interface TaskTimeConfigPersistenceDTO {
  timeType: string;
  startDate?: Date | null;
  // endDate 已移除
  timePoint?: number | null;
  timeRange?: string | null; // JSON
}
