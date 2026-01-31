/**
 * RecurrenceRule Value Object - Client Interface
 * 重复规则值对�?- 客户端接�?
 */

import type { DomainDate, TransferDate } from '@/primitives';
import type { RecurrenceFrequency } from './recurrence-frequency';
import type { DayOfWeek } from './day-of-week';
import type { RecurrenceRuleServerDTO } from './recurrence-rule-server';

// ============ 接口定义 ============

/**
 * 重复规则 - Client 接口
 */
export interface RecurrenceRuleClient {
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek: DayOfWeek[];
  endDate: DomainDate | null;
  occurrences: number | null;

  // UI 辅助属�?
  frequencyText: string;
  dayNames: string[];
  recurrenceDisplayText: string;
  hasEndCondition: boolean;

  // 值对象方�?
  equals(other: RecurrenceRuleClient): boolean;

  // DTO 转换方法
}

// ============ DTO 定义 ============

/**
 * RecurrenceRule Client DTO
 */
export interface RecurrenceRuleClientDTO {
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek: DayOfWeek[];
  endDate: TransferDate | null;
  occurrences: number | null;
  frequencyText: string;
  dayNames: string[];
  recurrenceDisplayText: string;
  hasEndCondition: boolean;
}
