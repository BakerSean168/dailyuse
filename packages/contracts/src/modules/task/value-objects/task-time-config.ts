/**
 * TaskTimeConfig Value Object - Server Interface
 */

import type { DomainDate, TransferDate, PersistenceDate } from '../../../primitives';
import type { TaskTimeType } from './task-time-type';

// ============ Interface Definitions ============

export interface TaskTimeConfig {
  timeType: TaskTimeType;
  startDate: DomainDate | null;
  timePoint: number | null;
  timeRange?: { start: number; end: number } | null;
}

// ============ DTO Definitions ============

export interface TaskTimeConfigDTO {
  timeType: TaskTimeType;
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
