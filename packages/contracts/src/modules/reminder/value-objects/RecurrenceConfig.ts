/**
 * Recurrence Config Value Object
 * 重复配置值对象
 */

import type { RecurrenceType, WeekDay } from '../enums';

// ============ 子配置接口 ============

/**
 * 每日重复配置
 */
export interface DailyRecurrence {
  /** 每 N 天 */
  interval: number;
}

/**
 * 每周重复配置
 */
export interface WeeklyRecurrence {
  /** 每 N 周 */
  interval: number;
  /** 星期几 */
  weekDays: WeekDay[];
}

/**
 * 自定义日期重复配置
 */
export interface CustomDaysRecurrence {
  /** 指定的日期列表 (epoch ms) */
  dates: number[];
}

// ============ 接口定义 ============

/**
 * 重复配置 - Server 接口
 */
export interface IRecurrenceConfigServer {
  type: RecurrenceType;
  daily?: DailyRecurrence | null;
  weekly?: WeeklyRecurrence | null;
  customDays?: CustomDaysRecurrence | null;

  // 值对象方法
  equals(other: IRecurrenceConfigServer): boolean;
  with(
    updates: Partial<
      Omit<
        IRecurrenceConfigServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IRecurrenceConfigServer;

  // DTO 转换方法}

/**
 * 重复配置 - Client 接口
 */
export interface IRecurrenceConfigClient {
  type: RecurrenceType;
  daily?: DailyRecurrence | null;
  weekly?: WeeklyRecurrence | null;
  customDays?: CustomDaysRecurrence | null;

  // UI 辅助属性
  displayText: string; // "每天" | "每周一、三、五" | "指定日期"

  // 值对象方法
  equals(other: IRecurrenceConfigClient): boolean;

  // DTO 转换方法}

// ============ DTO 定义 ============

/**
 * Recurrence Config Server DTO
 */
export interface RecurrenceConfigServerDTO {
  type: RecurrenceType;
  daily?: DailyRecurrence | null;
  weekly?: WeeklyRecurrence | null;
  customDays?: CustomDaysRecurrence | null;
}

/**
 * Recurrence Config Client DTO
 */
export interface RecurrenceConfigClientDTO {
  type: RecurrenceType;
  daily?: DailyRecurrence | null;
  weekly?: WeeklyRecurrence | null;
  customDays?: CustomDaysRecurrence | null;
  displayText: string;
}

/**
 * Recurrence Config Persistence DTO
 */
export interface RecurrenceConfigPersistenceDTO {
  type: RecurrenceType;
  daily?: string | null; // JSON string
  weekly?: string | null; // JSON string
  custom_days?: string | null; // JSON string
}

// ============ 类型导出 ============

export type RecurrenceConfigServer = IRecurrenceConfigServer;
export type RecurrenceConfigClient = IRecurrenceConfigClient;
