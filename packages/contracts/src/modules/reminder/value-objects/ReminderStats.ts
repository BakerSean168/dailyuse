/**
 * Reminder Stats Value Object
 * 提醒统计信息值对象
 */

// ============ 接口定义 ============

/**
 * 提醒统计信息 - Server 接口
 */
export interface IReminderStatsServer {
  /** 总触发次数 */
  totalTriggers: number;
  /** 最后触发时间 (epoch ms) */
  lastTriggeredAt?: number | null;

  // 值对象方法
  equals(other: IReminderStatsServer): boolean;
  with(
    updates: Partial<
      Omit<
        IReminderStatsServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IReminderStatsServer;

  // DTO 转换方法}

/**
 * 提醒统计信息 - Client 接口
 */
export interface IReminderStatsClient {
  totalTriggers: number;
  lastTriggeredAt?: number | null;

  // UI 辅助属性
  totalTriggersText: string; // "已触发 15 次"
  lastTriggeredText?: string | null; // "3 小时前"

  // 值对象方法
  equals(other: IReminderStatsClient): boolean;

  // DTO 转换方法}

// ============ DTO 定义 ============

/**
 * Reminder Stats Server DTO
 */
export interface ReminderStatsServerDTO {
  totalTriggers: number;
  lastTriggeredAt?: number | null;
}

/**
 * Reminder Stats Client DTO
 */
export interface ReminderStatsClientDTO {
  totalTriggers: number;
  lastTriggeredAt?: number | null;
  totalTriggersText: string;
  lastTriggeredText?: string | null;
}

/**
 * Reminder Stats Persistence DTO
 */
export interface ReminderStatsPersistenceDTO {
  total_triggers: number;
  last_triggered_at?: number | null;
}

// ============ 类型导出 ============

export type ReminderStatsServer = IReminderStatsServer;
export type ReminderStatsClient = IReminderStatsClient;
