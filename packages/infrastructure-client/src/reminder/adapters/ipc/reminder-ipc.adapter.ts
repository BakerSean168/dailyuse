/**
 * Reminder IPC Adapter
 *
 * IPC implementation of IReminderApiClient for Electron desktop apps.
 */

import type {
  IReminderApiClient,
  ReminderTemplatesResponse,
  ReminderGroupsResponse,
} from '../../ports/reminder-api-client.port';
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

/**
 * IPC API interface for Electron renderer process
 */
interface IpcApi {
  invoke<T>(channel: string, ...args: unknown[]): Promise<T>;
}

/**
 * ReminderIpcAdapter
 *
 * IPC 实现的提�?API 客户端（用于 Electron 桌面应用�?
 */
export class ReminderIpcAdapter implements IReminderApiClient {
  constructor(private readonly ipcApi: IpcApi) {}

  // ===== 模板 CRUD =====

  async createReminderTemplate(
    request: CreateReminderTemplateReq,
  ): Promise<ReminderTemplateClientDTO> {
    return this.ipcApi.invoke(REMINDER_CHANNELS.CREATE_TEMPLATE, request);
  }

  async getReminderTemplate(uuid: string): Promise<ReminderTemplateClientDTO> {
    return this.ipcApi.invoke(REMINDER_CHANNELS.GET_TEMPLATE, uuid);
  }

  async getReminderTemplates(params?: {
    page?: number;
    limit?: number;
  }): Promise<ReminderTemplatesResponse> {
    return this.ipcApi.invoke(REMINDER_CHANNELS.GET_TEMPLATES, params);
  }

  async getUserTemplates(accountUuid: string): Promise<ReminderTemplateClientDTO[]> {
    return this.ipcApi.invoke(REMINDER_CHANNELS.GET_USER_TEMPLATES, accountUuid);
  }

  async updateReminderTemplate(
    uuid: string,
    request: UpdateReminderTemplateReq,
  ): Promise<ReminderTemplateClientDTO> {
    return this.ipcApi.invoke(REMINDER_CHANNELS.UPDATE_TEMPLATE, uuid, request);
  }

  async deleteReminderTemplate(uuid: string): Promise<void> {
    await this.ipcApi.invoke(REMINDER_CHANNELS.DELETE_TEMPLATE, uuid);
  }

  async toggleTemplateEnabled(uuid: string): Promise<ReminderTemplateClientDTO> {
    return this.ipcApi.invoke(REMINDER_CHANNELS.TOGGLE_TEMPLATE, uuid);
  }

  async moveTemplateToGroup(
    templateUuid: string,
    targetGroupUuid: string | null,
  ): Promise<ReminderTemplateClientDTO> {
    return this.ipcApi.invoke(REMINDER_CHANNELS.MOVE_TEMPLATE, templateUuid, targetGroupUuid);
  }

  async searchTemplates(
    accountUuid: string,
    query: string,
  ): Promise<ReminderTemplateClientDTO[]> {
    return this.ipcApi.invoke(REMINDER_CHANNELS.SEARCH_TEMPLATES, accountUuid, query);
  }

  async getTemplateScheduleStatus(templateUuid: string): Promise<TemplateScheduleStatusRes> {
    return this.ipcApi.invoke(REMINDER_CHANNELS.GET_SCHEDULE_STATUS, templateUuid);
  }

  async getUpcomingReminders(params?: {
    days?: number;
    limit?: number;
    importanceLevel?: string;
    type?: string;
  }): Promise<GetUpcomingRemindersRes> {
    return this.ipcApi.invoke(REMINDER_CHANNELS.GET_UPCOMING, params);
  }

  // ===== 分组 CRUD =====

  async createReminderGroup(
    request: CreateReminderGroupReq,
  ): Promise<ReminderGroupClientDTO> {
    return this.ipcApi.invoke(REMINDER_CHANNELS.CREATE_GROUP, request);
  }

  async getReminderGroup(uuid: string): Promise<ReminderGroupClientDTO> {
    return this.ipcApi.invoke(REMINDER_CHANNELS.GET_GROUP, uuid);
  }

  async getReminderGroups(params?: {
    page?: number;
    limit?: number;
  }): Promise<ReminderGroupsResponse> {
    return this.ipcApi.invoke(REMINDER_CHANNELS.GET_GROUPS, params);
  }

  async getUserReminderGroups(accountUuid: string): Promise<ReminderGroupClientDTO[]> {
    return this.ipcApi.invoke(REMINDER_CHANNELS.GET_USER_GROUPS, accountUuid);
  }

  async updateReminderGroup(
    uuid: string,
    request: UpdateReminderGroupReq,
  ): Promise<ReminderGroupClientDTO> {
    return this.ipcApi.invoke(REMINDER_CHANNELS.UPDATE_GROUP, uuid, request);
  }

  async deleteReminderGroup(uuid: string): Promise<void> {
    await this.ipcApi.invoke(REMINDER_CHANNELS.DELETE_GROUP, uuid);
  }

  async toggleReminderGroupStatus(uuid: string): Promise<ReminderGroupClientDTO> {
    return this.ipcApi.invoke(REMINDER_CHANNELS.TOGGLE_GROUP_STATUS, uuid);
  }

  async toggleReminderGroupControlMode(uuid: string): Promise<ReminderGroupClientDTO> {
    return this.ipcApi.invoke(REMINDER_CHANNELS.TOGGLE_GROUP_CONTROL_MODE, uuid);
  }

  // ===== 统计 =====

  async getReminderStatistics(accountUuid: string): Promise<ReminderStatsClientDTO> {
    return this.ipcApi.invoke(REMINDER_CHANNELS.GET_STATISTICS, accountUuid);
  }
}

/**
 * Factory function to create ReminderIpcAdapter
 */
export function createReminderIpcAdapter(ipcApi: IpcApi): ReminderIpcAdapter {
  return new ReminderIpcAdapter(ipcApi);
}
