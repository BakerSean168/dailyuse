/**
 * RecurrenceRule Value Object - Client Interface
 * 重复规则值对象 - 客户端接口
 */

import type { RecurrenceFrequency, DayOfWeek } from '../enums';
import type { RecurrenceRuleServerDTO } from './RecurrenceRuleServer';

// ============ 接口定义 ============

/**
 * 重复规则 - Client 接口
 */
export interface RecurrenceRuleClient {
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek: DayOfWeek[];
  endDate?: Date | null;
  occurrences?: number | null;

  // UI 辅助属性
  frequencyText: string;
  dayNames: string[];
  recurrenceDisplayText: string;
  hasEndCondition: boolean;

  // 值对象方法
  equals(other: RecurrenceRuleClient): boolean;

  // DTO 转换方法
  toServerDTO(): RecurrenceRuleServerDTO;
}

// ============ DTO 定义 ============

/**
 * RecurrenceRule Client DTO
 */
export interface RecurrenceRuleClientDTO {
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek: DayOfWeek[];
  endDate?: number | null;
  occurrences?: number | null;
  frequencyText: string;
  dayNames: string[];
  recurrenceDisplayText: string;
  hasEndCondition: boolean;
}
