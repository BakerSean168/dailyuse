/**
 * Reminder Statistics Aggregate Root - Client Interface
 * 提醒统计聚合根 - 客户端接口
 */

import type { ReminderStatisticsServerDTO } from './ReminderStatisticsServer';
import type {
  TemplateStatsInfo,
  GroupStatsInfo,
  TriggerStatsInfo,
} from './ReminderStatisticsServer';

// ============ DTO 定义 ============

/**
 * Reminder Statistics Client DTO
 */
export interface ReminderStatisticsClientDTO {
  uuid: string;
  accountUuid: string;
  templateStats: TemplateStatsInfo;
  groupStats: GroupStatsInfo;
  triggerStats: TriggerStatsInfo;
  calculatedAt: number;

  // UI 扩展
  todayTriggersText: string; // "今日 15 次"
  weekTriggersText: string; // "本周 87 次"
  successRateText: string; // "成功率 98.5%"
}

// ============ 实体接口 ============

/**
 * Reminder Statistics 聚合根 - Client 接口
 */
export interface ReminderStatisticsClient {
  // 基础属性
  uuid: string;
  accountUuid: string;
  templateStats: TemplateStatsInfo;
  groupStats: GroupStatsInfo;
  triggerStats: TriggerStatsInfo;
  calculatedAt: number;

  // UI 扩展
  todayTriggersText: string;
  weekTriggersText: string;
  successRateText: string;

  // ===== UI 业务方法 =====

  /**
   * 获取成功率 (0-100)
   */
  getSuccessRate(): number;

  /**
   * 获取触发趋势
   */
  getTriggerTrend(): 'UP' | 'DOWN' | 'STABLE';

  // ===== 转换方法 =====

  /**
   * 转换为 Server DTO
   */}
