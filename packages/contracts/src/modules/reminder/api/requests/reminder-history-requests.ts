/**
 * Reminder History API Requests
 * 提醒历史 API 请求定义
 */

import type { ReminderHistoryClientDTO } from '../../entities';

// ============ Response Types ============

/**
 * 提醒历史详情响应（单个）
 */
export type ReminderHistoryDTO = ReminderHistoryClientDTO;

/**
 * 提醒历史列表响应
 */
export interface ReminderHistoryListDTO {
  history: ReminderHistoryClientDTO[];
  total: number;
  page?: number;
  pageSize?: number;
}
