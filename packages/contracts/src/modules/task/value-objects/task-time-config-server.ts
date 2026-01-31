/**
 * TaskTimeConfig Value Object - Server Interface
 * 任务时间配置值对�?- 服务端接�?
 */

import type { DomainDate, TransferDate, PersistenceDate } from '@/primitives';
import type { TimeType } from './time-type';
import type { TaskTimeConfigClientDTO } from './task-time-config-client';

// ============ 接口定义 ============

export interface TaskTimeConfigServer {
  timeType: TimeType;
  startDate: DomainDate | null;
  // endDate 已移�?- 结束日期属于重复规则的结束条件，不属于时间配�?
  timePoint: number | null;
  timeRange?: { start: number; end: number } | null;

  equals(other: TaskTimeConfigServer): boolean;
}

// ============ DTO 定义 ============

export interface TaskTimeConfigServerDTO {
  timeType: TimeType;
  startDate: TransferDate | null;
  // endDate 已移�?
  timePoint: number | null;
  timeRange?: { start: number; end: number } | null;
}

export interface TaskTimeConfigPersistenceDTO {
  timeType: string;
  startDate: PersistenceDate | null;
  // endDate 已移�?
  timePoint: number | null;
  timeRange: string | null; // JSON
}
