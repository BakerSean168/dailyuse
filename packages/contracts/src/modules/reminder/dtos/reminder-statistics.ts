  import type { TransferDate } from '@/primitives';


export interface ReminderStatisticsDTO {
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


// ============ 子统计信息接口 ============

/**
 * 模板统计信息
 */
export interface TemplateStatsInfo {
  totalTemplates: number;
  activeTemplates: number;
  pausedTemplates: number;
  oneTimeTemplates: number;
  recurringTemplates: number;
}

/**
 * 分组统计信息
 */
export interface GroupStatsInfo {
  totalGroups: number;
  activeGroups: number;
  pausedGroups: number;
  groupControlledGroups: number;
  individualControlledGroups: number;
}

/**
 * 触发统计信息
 */
export interface TriggerStatsInfo {
  todayTriggers: number;
  weekTriggers: number;
  monthTriggers: number;
  totalTriggers: number;
  successfulTriggers: number;
  failedTriggers: number;
}