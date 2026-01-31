/**
 * Reminder Statistics Aggregate Root - Client Interface
 * 提醒统计聚合�?- 客户端接�?
 */

import type {
  IdentityId,
  TransferDate,
  DomainDate,
} from '@/primitives';
import type { ReminderStatisticsServerDTO } from './reminder-statistics-server';
import type {
  TemplateStatsInfo,
  GroupStatsInfo,
  TriggerStatsInfo,
} from './reminder-statistics-server';

// ============ DTO 定义 ============

/**
 * Reminder Statistics Client DTO
 */
export interface ReminderStatisticsClientDTO {
  id: string;
  identityId: string;
  templateStats: TemplateStatsInfo;
  groupStats: GroupStatsInfo;
  triggerStats: TriggerStatsInfo;
  calculatedAt: TransferDate;

  // UI 扩展
  todayTriggersText: string; // "今日 15 �?
  weekTriggersText: string; // "本周 87 �?
  successRateText: string; // "成功�?98.5%"
}

// ============ 实体接口 ============

/**
 * Reminder Statistics 聚合�?- Client 接口
 */
export interface ReminderStatisticsClient {
  // 基础属�?
  id: string;
  identityId: IdentityId;
  templateStats: TemplateStatsInfo;
  groupStats: GroupStatsInfo;
  triggerStats: TriggerStatsInfo;
  calculatedAt: DomainDate;

  // UI 扩展
  todayTriggersText: string;
  weekTriggersText: string;
  successRateText: string;

  // ===== UI 业务方法 =====

  /**
   * 获取成功�?(0-100)
   */
  getSuccessRate(): number;

  /**
   * 获取触发趋势
   */
  getTriggerTrend(): 'UP' | 'DOWN' | 'STABLE';

}

/**
 * Reminder Statistics Client 静态工厂方法接�?
 */
