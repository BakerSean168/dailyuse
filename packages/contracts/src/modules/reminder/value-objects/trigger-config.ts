/**
 * Trigger Config Value Object
 * 触发器配置值对�?
 */

import type { TriggerType } from './trigger-type';

// ============ 子配置接�?============

/**
 * 固定时间触发配置
 */
export interface FixedTimeTrigger {
  /** 时间 "HH:mm" 格式（如 "09:00"�?*/
  time: string;
  /** 时区（可选，默认用户时区�?*/
  timezone: string | null;
}

/**
 * 间隔时间触发配置
 */
export interface IntervalTrigger {
  /** 每隔 N 分钟 */
  minutes: number;
  /** 开始时�?(epoch ms)（可选） */
  startTime: number | null;
}

// ============ 接口定义 ============

/**
 * 触发器配�?- Server 接口
 */
export interface ITriggerConfigServer {
  type: TriggerType;
  fixedTime: FixedTimeTrigger | null;
  interval: IntervalTrigger | null;

  // 值对象方�?
  with(
    updates: Partial<
      Omit<
        ITriggerConfigServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): ITriggerConfigServer;

  // DTO 转换方法
}

/**
 * 触发器配�?- Client 接口
 */
export interface ITriggerConfigClient {
  type: TriggerType;
  fixedTime: FixedTimeTrigger | null;
  interval: IntervalTrigger | null;

  // UI 辅助属�?
  displayText: string; // "每天 09:00" | "每隔 30 分钟"

  // 值对象方�?

  // DTO 转换方法
}

// ============ DTO 定义 ============

/**
 * Trigger Config Server DTO
 */
export interface TriggerConfigServerDTO {
  type: TriggerType;
  fixedTime: FixedTimeTrigger | null;
  interval: IntervalTrigger | null;
}

/**
 * Trigger Config Client DTO
 */
export interface TriggerConfigClientDTO {
  type: TriggerType;
  fixedTime: FixedTimeTrigger | null;
  interval: IntervalTrigger | null;
  displayText: string;
}

/**
 * Trigger Config Persistence DTO
 */
export interface TriggerConfigPersistenceDTO {
  type: TriggerType;
  fixed_time: string | null; // JSON string
  interval: string | null; // JSON string
}

// ============ 类型导出 ============

export type TriggerConfigServer = ITriggerConfigServer;
export type TriggerConfigClient = ITriggerConfigClient;
