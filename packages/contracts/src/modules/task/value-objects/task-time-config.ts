/**
 * TaskTimeConfig Value Object - Server Interface
 * 任务时间配置值对�?- 服务端接�?
 */

import type { DomainDate, TransferDate, PersistenceDate } from '@/primitives';
import type { TimeType } from './time-type';


// ============ 接口定义 ============

export interface TaskTimeConfig {
  timeType: TimeType;
  startDate: DomainDate | null;
  timePoint: number | null;
  timeRange?: { start: number; end: number } | null;

}

// ============ DTO 定义 ============

export interface TaskTimeConfigDTO {
  timeType: TimeType;
  startDate: TransferDate | null;

  timePoint: number | null;
  timeRange?: { start: number; end: number } | null;
}

export interface TaskTimeConfigPersistenceDTO {
  timeType: string;
  startDate: PersistenceDate | null;

  timePoint: number | null;
  timeRange: string | null; // JSON
}
