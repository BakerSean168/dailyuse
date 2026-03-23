/**
 * Reminder IPC Adapter
 *
 * IPC implementation of IReminderApiClient for Electron desktop apps.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IResultIpcClient, IReminderApiClient } from '../types';
import type {
  ReminderTemplateClientDTO,
  ReminderGroupClientDTO,
  ReminderTemplateListRes,
  ReminderGroupListRes,
  CreateReminderTemplateReq,
  UpdateReminderTemplateReq,
  CreateReminderGroupReq,
  UpdateReminderGroupReq,
  GetUpcomingRemindersRes,
} from '@dailyuse/contracts/reminder';
import type { ControlMode } from '@dailyuse/contracts/reminder';

/**
 * IPC channel definitions for Reminder operations.
 *
 * Channels listed here MUST have a matching `ipcMain.handle()` in
 * `electron-entry/index.ts` AND an entry in the preload ALLOWED_CHANNELS.
 */
const REMINDER_CHANNELS = {
  // Template CRUD
  CREATE_TEMPLATE: 'reminder:template:create',
  GET_TEMPLATE: 'reminder:template:get',
  GET_TEMPLATES: 'reminder:template:list',
  GET_USER_TEMPLATES: 'reminder:template:get-by-user',
  UPDATE_TEMPLATE: 'reminder:template:update',
  DELETE_TEMPLATE: 'reminder:template:delete',
  TOGGLE_TEMPLATE: 'reminder:template:toggle-enabled',
  MOVE_TEMPLATE: 'reminder:template:move-to-group',
  GET_UPCOMING: 'reminder:upcoming:get',
  // Group CRUD
  CREATE_GROUP: 'reminder:group:create',
  GET_GROUP: 'reminder:group:get',
  GET_GROUPS: 'reminder:group:list',
  GET_USER_GROUPS: 'reminder:group:get-by-user',
  UPDATE_GROUP: 'reminder:group:update',
  DELETE_GROUP: 'reminder:group:delete',
  TOGGLE_GROUP_STATUS: 'reminder:group:toggle-status',
  SWITCH_GROUP_CONTROL_MODE: 'reminder:group:switch-control-mode',
  GET_PREFERENCES: 'reminder:preferences:get',
  UPDATE_PREFERENCES: 'reminder:preferences:update',
} as const;

export class ReminderIpcAdapter implements IReminderApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  // ===== 模板 CRUD =====

  async createReminderTemplate(
    request: CreateReminderTemplateReq,
  ): Promise<Result<ReminderTemplateClientDTO>> {
    return this.ipcClient.invoke(REMINDER_CHANNELS.CREATE_TEMPLATE, request);
  }

  async getReminderTemplate(id: string): Promise<Result<ReminderTemplateClientDTO>> {
    return this.ipcClient.invoke(REMINDER_CHANNELS.GET_TEMPLATE, id);
  }

  /**
   * Lists reminder templates.
   * Note: The desktop handler resolves identity from auth context and does not
   * support pagination yet — params are forwarded but may be ignored server-side.
   */
  async getReminderTemplates(): Promise<Result<ReminderTemplateListRes>> {
    return this.ipcClient.invoke(REMINDER_CHANNELS.GET_TEMPLATES);
  }

  /**
   * Lists templates for the authenticated user.
   * Desktop handler resolves identity from auth context; identityId arg is
   * kept for HTTP adapter parity but unused by the IPC handler.
   */
  async getUserTemplates(): Promise<Result<ReminderTemplateClientDTO[]>> {
    return this.ipcClient.invoke(REMINDER_CHANNELS.GET_USER_TEMPLATES);
  }

  async updateReminderTemplate(
    id: string,
    request: UpdateReminderTemplateReq,
  ): Promise<Result<ReminderTemplateClientDTO>> {
    return this.ipcClient.invoke(REMINDER_CHANNELS.UPDATE_TEMPLATE, id, request);
  }

  async deleteReminderTemplate(id: string): Promise<Result<void>> {
    return this.ipcClient.invoke(REMINDER_CHANNELS.DELETE_TEMPLATE, id);
  }

  async toggleTemplateEnabled(id: string): Promise<Result<ReminderTemplateClientDTO>> {
    return this.ipcClient.invoke(REMINDER_CHANNELS.TOGGLE_TEMPLATE, id);
  }

  async moveTemplateToGroup(
    templateId: string,
    targetGroupId: string | null,
  ): Promise<Result<ReminderTemplateClientDTO>> {
    return this.ipcClient.invoke(REMINDER_CHANNELS.MOVE_TEMPLATE, templateId, {
      groupId: targetGroupId,
    });
  }

  async getUpcomingReminders(params?: {
    days?: number;
    limit?: number;
    importanceLevel?: string;
    type?: string;
  }): Promise<Result<GetUpcomingRemindersRes>> {
    return this.ipcClient.invoke(REMINDER_CHANNELS.GET_UPCOMING, params);
  }

  // ===== 分组 CRUD =====

  async createReminderGroup(
    request: CreateReminderGroupReq,
  ): Promise<Result<ReminderGroupClientDTO>> {
    return this.ipcClient.invoke(REMINDER_CHANNELS.CREATE_GROUP, request);
  }

  async getReminderGroup(id: string): Promise<Result<ReminderGroupClientDTO>> {
    return this.ipcClient.invoke(REMINDER_CHANNELS.GET_GROUP, id);
  }

  /**
   * Lists reminder groups.
   * Desktop handler resolves identity from auth context and does not support
   * pagination yet.
   */
  async getReminderGroups(): Promise<Result<ReminderGroupListRes>> {
    return this.ipcClient.invoke(REMINDER_CHANNELS.GET_GROUPS);
  }

  /**
   * Lists groups for the authenticated user.
   * Desktop handler resolves identity from auth context.
   */
  async getUserReminderGroups(): Promise<Result<ReminderGroupClientDTO[]>> {
    return this.ipcClient.invoke(REMINDER_CHANNELS.GET_USER_GROUPS);
  }

  async updateReminderGroup(
    id: string,
    request: UpdateReminderGroupReq,
  ): Promise<Result<ReminderGroupClientDTO>> {
    return this.ipcClient.invoke(REMINDER_CHANNELS.UPDATE_GROUP, id, request);
  }

  async deleteReminderGroup(id: string): Promise<Result<void>> {
    return this.ipcClient.invoke(REMINDER_CHANNELS.DELETE_GROUP, id);
  }

  async toggleReminderGroupStatus(id: string): Promise<Result<ReminderGroupClientDTO>> {
    return this.ipcClient.invoke(REMINDER_CHANNELS.TOGGLE_GROUP_STATUS, id);
  }

  /**
   * Switch the control mode for a reminder group.
   * Requires an explicit mode value (see ControlMode in contracts).
   */
  async switchReminderGroupControlMode(
    id: string,
    mode: ControlMode,
  ): Promise<Result<ReminderGroupClientDTO>> {
    return this.ipcClient.invoke(REMINDER_CHANNELS.SWITCH_GROUP_CONTROL_MODE, id, { mode });
  }

  async getPreferences(): Promise<Result<any>> {
    return this.ipcClient.invoke(REMINDER_CHANNELS.GET_PREFERENCES);
  }

  async updatePreferences(data: Record<string, unknown>): Promise<Result<any>> {
    return this.ipcClient.invoke(REMINDER_CHANNELS.UPDATE_PREFERENCES, data);
  }
}

export function createReminderIpcAdapter(ipcClient: IResultIpcClient): ReminderIpcAdapter {
  return new ReminderIpcAdapter(ipcClient);
}
