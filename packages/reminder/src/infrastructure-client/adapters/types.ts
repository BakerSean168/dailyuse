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
} from '@dailyuse/contracts/reminder';
import type { ControlMode } from '@dailyuse/contracts/reminder';

// ============ Transport Client Interfaces ============

// IResultHttpClient imported from @dailyuse/http-client

export interface IResultIpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<Result<T>>;
}

// ============ Port Interface ============

/**
 * IReminderApiClient
 *
 * 提醒模块 API 客户端接口
 *
 * Designed to match the actual handler capabilities of the IPC transport.
 * The desktop handler resolves identity from auth context and does not
 * support server-side pagination yet — list operations return flat arrays.
 */
export interface IReminderApiClient {
  // ===== 模板 CRUD =====
  createReminderTemplate(
    request: CreateReminderTemplateReq,
  ): Promise<Result<ReminderTemplateClientDTO>>;
  getReminderTemplate(id: string): Promise<Result<ReminderTemplateClientDTO>>;
  getReminderTemplates(): Promise<Result<ReminderTemplateClientDTO[]>>;
  getUserTemplates(): Promise<Result<ReminderTemplateClientDTO[]>>;
  updateReminderTemplate(
    id: string,
    request: UpdateReminderTemplateReq,
  ): Promise<Result<ReminderTemplateClientDTO>>;
  deleteReminderTemplate(id: string): Promise<Result<void>>;
  toggleTemplateEnabled(id: string): Promise<Result<ReminderTemplateClientDTO>>;
  moveTemplateToGroup(
    templateId: string,
    targetGroupId: string,
  ): Promise<Result<ReminderTemplateClientDTO>>;
  getUpcomingReminders(params?: {
    days?: number;
    limit?: number;
    importanceLevel?: string;
    type?: string;
  }): Promise<Result<GetUpcomingRemindersRes>>;

  // ===== 分组 CRUD =====
  createReminderGroup(request: CreateReminderGroupReq): Promise<Result<ReminderGroupClientDTO>>;
  getReminderGroup(id: string): Promise<Result<ReminderGroupClientDTO>>;
  getReminderGroups(): Promise<Result<ReminderGroupClientDTO[]>>;
  getUserReminderGroups(): Promise<Result<ReminderGroupClientDTO[]>>;
  updateReminderGroup(
    id: string,
    request: UpdateReminderGroupReq,
  ): Promise<Result<ReminderGroupClientDTO>>;
  deleteReminderGroup(id: string): Promise<Result<void>>;
  toggleReminderGroupStatus(id: string): Promise<Result<ReminderGroupClientDTO>>;
  switchReminderGroupControlMode(
    id: string,
    mode: ControlMode,
  ): Promise<Result<ReminderGroupClientDTO>>;
}
