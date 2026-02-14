/**
 * Reminder IPC Adapter
 *
 * IPC implementation of IReminderApiClient for Electron desktop apps.
 */

import type { Result } from '@dailyuse/contracts/result';
import { tryCatch } from '@dailyuse/contracts/result';
import type {
  IIpcClient,
  IReminderApiClient,
  ReminderTemplatesResponse,
  ReminderGroupsResponse,
} from '../types';
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

/**
 * IPC channel definitions for Reminder operations
 */
const REMINDER_CHANNELS = {
  // Template CRUD
  CREATE_TEMPLATE: 'reminder:template:create',
  GET_TEMPLATE: 'reminder:template:get',
  GET_TEMPLATES: 'reminder:template:list',
  GET_USER_TEMPLATES: 'reminder:template:get-by-user',
  UPDATE_TEMPLATE: 'reminder:template:update',
  DELETE_TEMPLATE: 'reminder:template:delete',
  TOGGLE_TEMPLATE: 'reminder:template:toggle',
  MOVE_TEMPLATE: 'reminder:template:move',
  SEARCH_TEMPLATES: 'reminder:template:search',
  GET_SCHEDULE_STATUS: 'reminder:template:schedule-status',
  GET_UPCOMING: 'reminder:upcoming:get',
  // Group CRUD
  CREATE_GROUP: 'reminder:group:create',
  GET_GROUP: 'reminder:group:get',
  GET_GROUPS: 'reminder:group:list',
  GET_USER_GROUPS: 'reminder:group:get-by-user',
  UPDATE_GROUP: 'reminder:group:update',
  DELETE_GROUP: 'reminder:group:delete',
  TOGGLE_GROUP_STATUS: 'reminder:group:toggle-status',
  TOGGLE_GROUP_CONTROL_MODE: 'reminder:group:toggle-control-mode',
  // Statistics
  GET_STATISTICS: 'reminder:statistics:get',
} as const;

export class ReminderIpcAdapter implements IReminderApiClient {
  constructor(private readonly ipcClient: IIpcClient) {}

  // ===== 模板 CRUD =====

  async createReminderTemplate(
    request: CreateReminderTemplateReq,
  ): Promise<Result<ReminderTemplateClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(REMINDER_CHANNELS.CREATE_TEMPLATE, request));
  }

  async getReminderTemplate(uuid: string): Promise<Result<ReminderTemplateClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(REMINDER_CHANNELS.GET_TEMPLATE, uuid));
  }

  async getReminderTemplates(params?: {
    page?: number;
    limit?: number;
  }): Promise<Result<ReminderTemplatesResponse>> {
    return tryCatch(() => this.ipcClient.invoke(REMINDER_CHANNELS.GET_TEMPLATES, params));
  }

  async getUserTemplates(accountUuid: string): Promise<Result<ReminderTemplateClientDTO[]>> {
    return tryCatch(() => this.ipcClient.invoke(REMINDER_CHANNELS.GET_USER_TEMPLATES, accountUuid));
  }

  async updateReminderTemplate(
    uuid: string,
    request: UpdateReminderTemplateReq,
  ): Promise<Result<ReminderTemplateClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(REMINDER_CHANNELS.UPDATE_TEMPLATE, uuid, request));
  }

  async deleteReminderTemplate(uuid: string): Promise<Result<void>> {
    return tryCatch(() => this.ipcClient.invoke(REMINDER_CHANNELS.DELETE_TEMPLATE, uuid));
  }

  async toggleTemplateEnabled(uuid: string): Promise<Result<ReminderTemplateClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(REMINDER_CHANNELS.TOGGLE_TEMPLATE, uuid));
  }

  async moveTemplateToGroup(
    templateUuid: string,
    targetGroupUuid: string | null,
  ): Promise<Result<ReminderTemplateClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(REMINDER_CHANNELS.MOVE_TEMPLATE, templateUuid, targetGroupUuid));
  }

  async searchTemplates(
    accountUuid: string,
    query: string,
  ): Promise<Result<ReminderTemplateClientDTO[]>> {
    return tryCatch(() => this.ipcClient.invoke(REMINDER_CHANNELS.SEARCH_TEMPLATES, accountUuid, query));
  }

  async getTemplateScheduleStatus(templateUuid: string): Promise<Result<TemplateScheduleStatusRes>> {
    return tryCatch(() => this.ipcClient.invoke(REMINDER_CHANNELS.GET_SCHEDULE_STATUS, templateUuid));
  }

  async getUpcomingReminders(params?: {
    days?: number;
    limit?: number;
    importanceLevel?: string;
    type?: string;
  }): Promise<Result<GetUpcomingRemindersRes>> {
    return tryCatch(() => this.ipcClient.invoke(REMINDER_CHANNELS.GET_UPCOMING, params));
  }

  // ===== 分组 CRUD =====

  async createReminderGroup(
    request: CreateReminderGroupReq,
  ): Promise<Result<ReminderGroupClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(REMINDER_CHANNELS.CREATE_GROUP, request));
  }

  async getReminderGroup(uuid: string): Promise<Result<ReminderGroupClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(REMINDER_CHANNELS.GET_GROUP, uuid));
  }

  async getReminderGroups(params?: {
    page?: number;
    limit?: number;
  }): Promise<Result<ReminderGroupsResponse>> {
    return tryCatch(() => this.ipcClient.invoke(REMINDER_CHANNELS.GET_GROUPS, params));
  }

  async getUserReminderGroups(accountUuid: string): Promise<Result<ReminderGroupClientDTO[]>> {
    return tryCatch(() => this.ipcClient.invoke(REMINDER_CHANNELS.GET_USER_GROUPS, accountUuid));
  }

  async updateReminderGroup(
    uuid: string,
    request: UpdateReminderGroupReq,
  ): Promise<Result<ReminderGroupClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(REMINDER_CHANNELS.UPDATE_GROUP, uuid, request));
  }

  async deleteReminderGroup(uuid: string): Promise<Result<void>> {
    return tryCatch(() => this.ipcClient.invoke(REMINDER_CHANNELS.DELETE_GROUP, uuid));
  }

  async toggleReminderGroupStatus(uuid: string): Promise<Result<ReminderGroupClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(REMINDER_CHANNELS.TOGGLE_GROUP_STATUS, uuid));
  }

  async toggleReminderGroupControlMode(uuid: string): Promise<Result<ReminderGroupClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(REMINDER_CHANNELS.TOGGLE_GROUP_CONTROL_MODE, uuid));
  }

  // ===== 统计 =====

  async getReminderStatistics(accountUuid: string): Promise<Result<ReminderStatsClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(REMINDER_CHANNELS.GET_STATISTICS, accountUuid));
  }
}

/**
 * Factory function to create ReminderIpcAdapter
 */
export function createReminderIpcAdapter(ipcClient: IIpcClient): ReminderIpcAdapter {
  return new ReminderIpcAdapter(ipcClient);
}
