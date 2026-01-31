/**
 * RecurrenceRule Value Object - Server Interface
 * 重复规则值对�?- 服务端接�?
 */

import type { DomainDate, TransferDate, PersistenceDate } from '@/primitives';
import type { RecurrenceFrequency } from './recurrence-frequency';
import type { DayOfWeek } from './day-of-week';
import type { RecurrenceRuleClientDTO } from './recurrence-rule-client';

// ============ 接口定义 ============

/**
 * 重复规则 - Server 接口
 */
export interface RecurrenceRuleServer {
  frequency: RecurrenceFrequency;
  interval: number; // 间隔（如�?天、每3周）
  daysOfWeek: DayOfWeek[]; // 星期几（WEEKLY时使用）
  endDate: DomainDate | null; // 结束日期
  occurrences: number | null; // 重复次数

  // 值对象方�?
  equals(other: RecurrenceRuleServer): boolean;
  with(
    updates: Partial<
      Omit<
        RecurrenceRuleServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): RecurrenceRuleServer;

  // DTO 转换方法
}

// ============ DTO 定义 ============

/**
 * RecurrenceRule Server DTO
 */
export interface RecurrenceRuleServerDTO {
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek: DayOfWeek[];
  endDate: TransferDate | null;
  occurrences: number | null;
}

/**
 * RecurrenceRule Persistence DTO
 */
export interface RecurrenceRulePersistenceDTO {
  frequency: string;
  interval: number;
  daysOfWeek: string; // JSON array
  endDate: PersistenceDate | null;
  occurrences: number | null;
}
