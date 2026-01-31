/**
 * Reminder Stats Value Object
 * 提醒统计信息值对�?
 */

// ============ 接口定义 ============

/**
 * 提醒统计信息 - Server 接口
 */
export interface IReminderStatsServer {
  /** 总触发次�?*/
  totalTriggers: number;
  /** 最后触发时�?(epoch ms) */
  lastTriggeredAt: number | null;

  // 值对象方�?
  with(
    updates: Partial<
      Omit<
        IReminderStatsServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IReminderStatsServer;

  // DTO 转换方法
}

/**
 * 提醒统计信息 - Client 接口
 */
export interface IReminderStatsClient {
  totalTriggers: number;
  lastTriggeredAt: number | null;

  // UI 辅助属�?
  totalTriggersText: string; // "已触�?15 �?
  lastTriggeredText: string | null; // "3 小时�?

  // 值对象方�?

  // DTO 转换方法
}

// ============ DTO 定义 ============

/**
 * Reminder Stats Server DTO
 */
export interface ReminderStatsServerDTO {
  totalTriggers: number;
  lastTriggeredAt: number | null;
}

/**
 * Reminder Stats Client DTO
 */
export interface ReminderStatsClientDTO {
  totalTriggers: number;
  lastTriggeredAt: number | null;
  totalTriggersText: string;
  lastTriggeredText: string | null;
}

/**
 * Reminder Stats Persistence DTO
 */
export interface ReminderStatsPersistenceDTO {
  total_triggers: number;
  last_triggered_at: number | null;
}

// ============ 类型导出 ============

export type ReminderStatsServer = IReminderStatsServer;
export type ReminderStatsClient = IReminderStatsClient;
