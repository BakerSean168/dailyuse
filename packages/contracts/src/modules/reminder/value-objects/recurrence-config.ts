/**
 * Recurrence Config Value Object
 * 重复配置值对�?
 */

import type { RecurrenceType } from './recurrence-type';
import type { WeekDay } from './week-day';

// ============ 子配置接�?============

/**
 * 每日重复配置
 */
export interface DailyRecurrence {
  /** �?N �?*/
  interval: number;
}

/**
 * 每周重复配置
 */
export interface WeeklyRecurrence {
  /** �?N �?*/
  interval: number;
  /** 星期�?*/
  weekDays: WeekDay[];
}

/**
 * 自定义日期重复配�?
 */
export interface CustomDaysRecurrence {
  /** 指定的日期列�?(epoch ms) */
  dates: number[];
}

// ============ 接口定义 ============

/**
 * 重复配置 - Server 接口
 */
export interface IRecurrenceConfigServer {
  type: RecurrenceType;
  daily: DailyRecurrence | null;
  weekly: WeeklyRecurrence | null;
  customDays: CustomDaysRecurrence | null;

  // 值对象方�?
  equals(other: IRecurrenceConfigServer): boolean;
  with(
    updates: Partial<
      Omit<
        IRecurrenceConfigServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IRecurrenceConfigServer;

  // DTO 转换方法
}

/**
 * 重复配置 - Client 接口
 */
export interface IRecurrenceConfigClient {
  type: RecurrenceType;
  daily: DailyRecurrence | null;
  weekly: WeeklyRecurrence | null;
  customDays: CustomDaysRecurrence | null;

  // UI 辅助属�?
  displayText: string; // "每天" | "每周一、三、五" | "指定日期"

  // 值对象方�?
  equals(other: IRecurrenceConfigClient): boolean;

  // DTO 转换方法
}

// ============ DTO 定义 ============

/**
 * Recurrence Config Server DTO
 */
export interface RecurrenceConfigServerDTO {
  type: RecurrenceType;
  daily: DailyRecurrence | null;
  weekly: WeeklyRecurrence | null;
  customDays: CustomDaysRecurrence | null;
}

/**
 * Recurrence Config Client DTO
 */
export interface RecurrenceConfigClientDTO {
  type: RecurrenceType;
  daily: DailyRecurrence | null;
  weekly: WeeklyRecurrence | null;
  customDays: CustomDaysRecurrence | null;
  displayText: string;
}

/**
 * Recurrence Config Persistence DTO
 */
export interface RecurrenceConfigPersistenceDTO {
  type: RecurrenceType;
  daily: string | null; // JSON string
  weekly: string | null; // JSON string
  custom_days: string | null; // JSON string
}

// ============ 类型导出 ============

export type RecurrenceConfigServer = IRecurrenceConfigServer;
export type RecurrenceConfigClient = IRecurrenceConfigClient;
