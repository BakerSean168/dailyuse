/**
 * Reminder Module - API Requests and Responses
 * 提醒模块 - API 请求和响应定义
 */

import { ImportanceLevel } from '../../shared/value-objects/importance';
import type {
  ReminderTemplateClientDTO,
  ReminderGroupClientDTO,
  ReminderStatisticsClientDTO,
} from './aggregates';
import type { ReminderHistoryClientDTO } from './entities';
import type { ReminderType, ReminderStatus, ControlMode } from './enums';
import type {
  TriggerConfigServerDTO,
  RecurrenceConfigServerDTO,
  ActiveTimeConfigServerDTO,
  ActiveHoursConfigServerDTO,
  NotificationConfigServerDTO,
} from './value-objects';
import type { BatchOperationResponseDTO as SharedBatchOperationResponseDTO } from '../../shared/dtos/chart-data.dto';

// ============ Reminder Template 请求 ============

/**
 * 创建提醒模板请求
 */
export interface CreateReminderTemplateRequest {
  title: string;
  type: ReminderType;
  trigger: TriggerConfigServerDTO;
  activeTime: ActiveTimeConfigServerDTO;
  notificationConfig: NotificationConfigServerDTO;
  description?: string;
  recurrence?: RecurrenceConfigServerDTO;
  activeHours?: ActiveHoursConfigServerDTO;
  importanceLevel?: ImportanceLevel;
  tags?: string[];
  color?: string;
  icon?: string;
  groupUuid?: string;
}

/**
 * 更新提醒模板请求
 */
export interface UpdateReminderTemplateRequest {
  title?: string;
  description?: string;
  trigger?: TriggerConfigServerDTO;
  recurrence?: RecurrenceConfigServerDTO;
  activeTime?: ActiveTimeConfigServerDTO;
  activeHours?: ActiveHoursConfigServerDTO;
  notificationConfig?: NotificationConfigServerDTO;
  importanceLevel?: ImportanceLevel;
  tags?: string[];
  color?: string;
  icon?: string;
  groupUuid?: string;
}

/**
 * 查询提醒模板请求
 */
export interface QueryReminderTemplatesRequest {
  status?: ReminderStatus;
  type?: ReminderType;
  groupUuid?: string;
  tags?: string[];
  importanceLevel?: ImportanceLevel;
  effectiveEnabled?: boolean; // 查询实际启用状态
}

// ============ Reminder Template 响应 ============

/**
 * 提醒模板详情响应（单个）
 */
export type ReminderTemplateDTO = ReminderTemplateClientDTO;

/**
 * 提醒模板列表响应
 */
export interface ReminderTemplateListDTO {
  templates: ReminderTemplateClientDTO[];
  total: number;
  page?: number;
  pageSize?: number;
}

// ============ Reminder Group 请求 ============

/**
 * 创建提醒分组请求
 */
export interface CreateReminderGroupRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  controlMode?: ControlMode;
  order?: number;
}

/**
 * 更新提醒分组请求
 */
export interface UpdateReminderGroupRequest {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  controlMode?: ControlMode;
  order?: number;
}

/**
 * 切换分组控制模式请求
 */
export interface SwitchGroupControlModeRequest {
  mode: ControlMode;
}

/**
 * 批量操作分组模板请求
 */
export interface BatchGroupTemplatesRequest {
  action: 'ENABLE' | 'PAUSE';
}

// ============ Reminder Group 响应 ============

/**
 * 提醒分组详情响应（单个）
 */
export type ReminderGroupDTO = ReminderGroupClientDTO;

/**
 * 提醒分组列表响应
 */
export interface ReminderGroupListDTO {
  groups: ReminderGroupClientDTO[];
  total: number;
}

// ============ Reminder History 响应 ============

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

// ============ Reminder Statistics 响应 ============

/**
 * 提醒统计响应
 */
export type ReminderStatisticsDTO = ReminderStatisticsClientDTO;

// ============ 操作响应 ============

/**
 * 启用/暂停操作响应
 */
export interface ReminderOperationResponseDTO {
  ok: boolean;
  message?: string;
  affectedCount?: number;
}

/**
 * 触发操作响应
 */
export interface ReminderTriggerResponseDTO {
  ok: boolean;
  triggeredAt: number;
  nextTriggerAt?: number | null;
  message?: string;
}

/**
 * 批量操作响应
 */
export interface BatchOperationResponseDTO {
  successCount: number;
  failedCount: number;
  errors?: Array<{
    uuid: string;
    error: string;
  }>;
}

// ============ Schedule（调度相关）============

/**
 * 模板调度状态 DTO
 */
export interface TemplateScheduleStatusDTO {
  templateUuid: string;
  hasSchedule: boolean; // 是否配置了调度
  enabled: boolean; // 是否启用
  status: ReminderStatus; // 当前状态
  nextTriggerAt: number | null; // 下次触发时间
  lastTriggeredAt: number | null; // 上次触发时间
  triggerCount: number; // 总触发次数
  lastTriggerResult?: 'SUCCESS' | 'FAILED' | null; // 上次触发结果
  errorMessage?: string | null; // 错误信息（如果有）
  updatedAt: number;
}

/**
 * 即将到来的提醒项
 * 基于模板+调度计算出的提醒触发时间
 */
export interface UpcomingReminderItemDTO {
  templateUuid: string;
  templateTitle: string;
  templateType: ReminderType;
  importanceLevel: ImportanceLevel;
  scheduledTime: number; // 计划触发时间
  description?: string | null;
  tags?: string[];
  color?: string | null;
  icon?: string | null;
}

/**
 * 获取即将到来的提醒请求
 */
export interface GetUpcomingRemindersRequest {
  days?: number; // 未来多少天，默认7天
  limit?: number; // 返回数量限制
  importanceLevel?: ImportanceLevel; // 按重要程度筛选
  type?: ReminderType; // 按类型筛选
}

/**
 * 即将到来的提醒响应
 */
export interface UpcomingRemindersResponseDTO {
  reminders: UpcomingReminderItemDTO[];
  total: number;
  fromDate: number; // 查询起始时间
  toDate: number; // 查询结束时间
}
