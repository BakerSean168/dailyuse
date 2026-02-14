/**
 * Reminder Infrastructure Client - Port Interfaces
 *
 * Transport-agnostic interfaces for Reminder API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 *
 * Types imported from @dailyuse/contracts/reminder.
 */

import type { IHttpClient } from '@dailyuse/http-client';
import type {
  ReminderTemplateClientDTO,
  ReminderGroupClientDTO,
  ReminderStatsClientDTO,
  CreateReminderTemplateReq,
  UpdateReminderTemplateReq,
  CreateReminderGroupReq,
  UpdateReminderGroupReq,
  GetUpcomingRemindersRes,
  TemplateScheduleStatusRes,
} from '@dailyuse/contracts/reminder';

// ============ Transport Client Interfaces ============

// IHttpClient imported from @dailyuse/http-client

export interface IIpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;
}

// ============ Local Response Types ============

export interface ReminderTemplatesResponse {
  templates: ReminderTemplateClientDTO[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ReminderGroupsResponse {
  groups: ReminderGroupClientDTO[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============ Port Interface ============

/**
 * IReminderApiClient
 *
 * 提醒模块 API 客户端接口
 */
export interface IReminderApiClient {
  // ===== 模板 CRUD =====
  createReminderTemplate(request: CreateReminderTemplateReq): Promise<ReminderTemplateClientDTO>;
  getReminderTemplate(uuid: string): Promise<ReminderTemplateClientDTO>;
  getReminderTemplates(params?: { page?: number; limit?: number }): Promise<ReminderTemplatesResponse>;
  getUserTemplates(accountUuid: string): Promise<ReminderTemplateClientDTO[]>;
  updateReminderTemplate(uuid: string, request: UpdateReminderTemplateReq): Promise<ReminderTemplateClientDTO>;
  deleteReminderTemplate(uuid: string): Promise<void>;
  toggleTemplateEnabled(uuid: string): Promise<ReminderTemplateClientDTO>;
  moveTemplateToGroup(templateUuid: string, targetGroupUuid: string | null): Promise<ReminderTemplateClientDTO>;
  searchTemplates(accountUuid: string, query: string): Promise<ReminderTemplateClientDTO[]>;
  getTemplateScheduleStatus(templateUuid: string): Promise<TemplateScheduleStatusRes>;
  getUpcomingReminders(params?: { days?: number; limit?: number; importanceLevel?: string; type?: string }): Promise<GetUpcomingRemindersRes>;

  // ===== 分组 CRUD =====
  createReminderGroup(request: CreateReminderGroupReq): Promise<ReminderGroupClientDTO>;
  getReminderGroup(uuid: string): Promise<ReminderGroupClientDTO>;
  getReminderGroups(params?: { page?: number; limit?: number }): Promise<ReminderGroupsResponse>;
  getUserReminderGroups(accountUuid: string): Promise<ReminderGroupClientDTO[]>;
  updateReminderGroup(uuid: string, request: UpdateReminderGroupReq): Promise<ReminderGroupClientDTO>;
  deleteReminderGroup(uuid: string): Promise<void>;
  toggleReminderGroupStatus(uuid: string): Promise<ReminderGroupClientDTO>;
  toggleReminderGroupControlMode(uuid: string): Promise<ReminderGroupClientDTO>;

  // ===== 统计 =====
  getReminderStatistics(accountUuid: string): Promise<ReminderStatsClientDTO>;
}
