/**
 * Reminder Infrastructure Client - Port Interfaces
 *
 * Transport-agnostic interfaces for Reminder API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 *
 * Types imported from @dailyuse/contracts/reminder.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IResultHttpClient } from '@dailyuse/http-client';
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

// IResultHttpClient imported from @dailyuse/http-client

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
  createReminderTemplate(request: CreateReminderTemplateReq): Promise<Result<ReminderTemplateClientDTO>>;
  getReminderTemplate(uuid: string): Promise<Result<ReminderTemplateClientDTO>>;
  getReminderTemplates(params?: { page?: number; limit?: number }): Promise<Result<ReminderTemplatesResponse>>;
  getUserTemplates(accountUuid: string): Promise<Result<ReminderTemplateClientDTO[]>>;
  updateReminderTemplate(uuid: string, request: UpdateReminderTemplateReq): Promise<Result<ReminderTemplateClientDTO>>;
  deleteReminderTemplate(uuid: string): Promise<Result<void>>;
  toggleTemplateEnabled(uuid: string): Promise<Result<ReminderTemplateClientDTO>>;
  moveTemplateToGroup(templateUuid: string, targetGroupUuid: string | null): Promise<Result<ReminderTemplateClientDTO>>;
  searchTemplates(accountUuid: string, query: string): Promise<Result<ReminderTemplateClientDTO[]>>;
  getTemplateScheduleStatus(templateUuid: string): Promise<Result<TemplateScheduleStatusRes>>;
  getUpcomingReminders(params?: { days?: number; limit?: number; importanceLevel?: string; type?: string }): Promise<Result<GetUpcomingRemindersRes>>;

  // ===== 分组 CRUD =====
  createReminderGroup(request: CreateReminderGroupReq): Promise<Result<ReminderGroupClientDTO>>;
  getReminderGroup(uuid: string): Promise<Result<ReminderGroupClientDTO>>;
  getReminderGroups(params?: { page?: number; limit?: number }): Promise<Result<ReminderGroupsResponse>>;
  getUserReminderGroups(accountUuid: string): Promise<Result<ReminderGroupClientDTO[]>>;
  updateReminderGroup(uuid: string, request: UpdateReminderGroupReq): Promise<Result<ReminderGroupClientDTO>>;
  deleteReminderGroup(uuid: string): Promise<Result<void>>;
  toggleReminderGroupStatus(uuid: string): Promise<Result<ReminderGroupClientDTO>>;
  toggleReminderGroupControlMode(uuid: string): Promise<Result<ReminderGroupClientDTO>>;

  // ===== 统计 =====
  getReminderStatistics(accountUuid: string): Promise<Result<ReminderStatsClientDTO>>;
}
