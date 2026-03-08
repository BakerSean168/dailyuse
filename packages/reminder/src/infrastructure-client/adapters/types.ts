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
  CreateReminderTemplateReq,
  UpdateReminderTemplateReq,
  CreateReminderGroupReq,
  UpdateReminderGroupReq,
  GetUpcomingRemindersRes,
  TemplateScheduleStatusRes,
} from '@dailyuse/contracts/reminder';

// ============ Transport Client Interfaces ============

// IResultHttpClient imported from @dailyuse/http-client

export interface IResultIpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<Result<T>>;
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
  getReminderTemplate(id: string): Promise<Result<ReminderTemplateClientDTO>>;
  getReminderTemplates(params?: { page?: number; limit?: number }): Promise<Result<ReminderTemplatesResponse>>;
  getUserTemplates(identityId: string): Promise<Result<ReminderTemplateClientDTO[]>>;
  updateReminderTemplate(id: string, request: UpdateReminderTemplateReq): Promise<Result<ReminderTemplateClientDTO>>;
  deleteReminderTemplate(id: string): Promise<Result<void>>;
  toggleTemplateEnabled(id: string): Promise<Result<ReminderTemplateClientDTO>>;
  moveTemplateToGroup(templateId: string, targetGroupId: string | null): Promise<Result<ReminderTemplateClientDTO>>;
  searchTemplates(identityId: string, query: string): Promise<Result<ReminderTemplateClientDTO[]>>;
  getTemplateScheduleStatus(templateId: string): Promise<Result<TemplateScheduleStatusRes>>;
  getUpcomingReminders(params?: { days?: number; limit?: number; importanceLevel?: string; type?: string }): Promise<Result<GetUpcomingRemindersRes>>;

  // ===== 分组 CRUD =====
  createReminderGroup(request: CreateReminderGroupReq): Promise<Result<ReminderGroupClientDTO>>;
  getReminderGroup(id: string): Promise<Result<ReminderGroupClientDTO>>;
  getReminderGroups(params?: { page?: number; limit?: number }): Promise<Result<ReminderGroupsResponse>>;
  getUserReminderGroups(identityId: string): Promise<Result<ReminderGroupClientDTO[]>>;
  updateReminderGroup(id: string, request: UpdateReminderGroupReq): Promise<Result<ReminderGroupClientDTO>>;
  deleteReminderGroup(id: string): Promise<Result<void>>;
  toggleReminderGroupStatus(id: string): Promise<Result<ReminderGroupClientDTO>>;
  toggleReminderGroupControlMode(id: string): Promise<Result<ReminderGroupClientDTO>>;
}
