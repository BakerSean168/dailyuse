/**
 * Schedule Config Value Object
 * 调度配置值对�?
 */

import type { Timezone } from './timezone';

// ============ 接口定义 ============

/**
 * 调度配置 - Server 接口
 */
export interface IScheduleConfigServer {
  /** Cron 表达�?*/
  cronExpression: string;

  /** 时区 */
  timezone: Timezone;

  /** 开始日期（可选，null 表示立即开始） */
  startDate: number | null;

  /** 结束日期（可选，null 表示永不结束�?*/
  endDate: number | null;

  /** 最大执行次数（可选，null 表示无限�?*/
  maxExecutions: number | null;

  // 值对象方�?
  with(
    updates: Partial<
      Omit<
        IScheduleConfigServer,
        | 'equals'
        | 'with'
        | 'calculateNextRun'
        | 'isExpired'
        | 'toServerDTO'
        | 'toClientDTO'
        | 'toPersistenceDTO'
      >
    >,
  ): IScheduleConfigServer;

  // DTO 转换方法
}

/**
 * 调度配置 - Client 接口
 */
export interface IScheduleConfigClient {
  /** Cron 表达�?*/
  cronExpression: string;

  /** 时区 */
  timezone: Timezone;

  /** 开始日�?*/
  startDate: Date | null;

  /** 结束日期 */
  endDate: Date | null;

  /** 最大执行次�?*/
  maxExecutions: number | null;

  // UI 辅助属�?
  /** Cron 表达式的人类可读描述 */
  cronDescription: string; // "每天 9:00"

  /** 时区显示名称 */
  timezoneDisplay: string; // "上海 (UTC+8)"

  /** 开始日期格式化 */
  startDateFormatted: string | null; // "2025-01-01 09:00"

  /** 结束日期格式�?*/
  endDateFormatted: string | null;

  /** 最大执行次数格式化 */
  maxExecutionsFormatted: string; // "无限" | "100 �?

  // 值对象方�?

  // DTO 转换方法
}

// ============ DTO 定义 ============

/**
 * Schedule Config Server DTO
 */
export interface ScheduleConfigServerDTO {
  cronExpression: string;
  timezone: Timezone;
  startDate: string | null; // ISO string
  endDate: string | null;
  maxExecutions: number | null;
}

/**
 * Schedule Config Client DTO
 */
export interface ScheduleConfigClientDTO {
  cronExpression: string;
  timezone: Timezone;
  startDate: string | null;
  endDate: string | null;
  maxExecutions: number | null;
  cronDescription: string;
  timezoneDisplay: string;
  startDateFormatted: string | null;
  endDateFormatted: string | null;
  maxExecutionsFormatted: string;
}

/**
 * Schedule Config Persistence DTO
 */
export interface ScheduleConfigPersistenceDTO {
  cronExpression: string;
  timezone: string;
  startDate: string | null;
  endDate: string | null;
  maxExecutions: number | null;
}

// ============ 类型导出 ============

export type ScheduleConfigServer = IScheduleConfigServer;
export type ScheduleConfigClient = IScheduleConfigClient;
