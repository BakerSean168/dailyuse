/**
 * Reminder Application Service - Renderer
 *
 * 提醒应用服务 - 渲染进程
 */

import {
  // Reminder Template Use Cases
  CreateReminderTemplate,
  GetReminderTemplate,
  ListReminderTemplates,
  GetUserTemplates,
  UpdateReminderTemplate,
  DeleteReminderTemplate,
  ToggleTemplateEnabled,
  MoveTemplateToGroup,
  SearchTemplates,
  GetTemplateScheduleStatus,
  GetUpcomingReminders,
  // Reminder Group Use Cases
  CreateReminderGroup,
  GetReminderGroup,
  ListReminderGroups,
  GetUserReminderGroups,
  UpdateReminderGroup,
  DeleteReminderGroup,
  ToggleReminderGroupStatus,
  ToggleReminderGroupControlMode,
  // Statistics
  GetReminderStatistics,
} from '@dailyuse/application-client';

// Local type definitions (not re-exported from main index)
export interface ListReminderTemplatesParams {
  page?: number;
  pageSize?: number;
  status?: string;
  type?: string;
  groupUuid?: string;
  tags?: string[];
}

export interface ListReminderTemplatesResult {
  templates: ReminderTemplateClientDTO[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface GetUpcomingRemindersParams {
  limit?: number;
  hoursAhead?: number;
}

export interface ListReminderGroupsParams {
  page?: number;
  pageSize?: number;
}

export interface ListReminderGroupsResult {
  groups: ReminderGroupClientDTO[];
  total: number;
  page: number;
  pageSize: number;
}
import type {
  ReminderTemplateClientDTO,
  ReminderGroupClientDTO,
  CreateReminderTemplateRequest,
  UpdateReminderTemplateRequest,
  CreateReminderGroupRequest,
  UpdateReminderGroupRequest,
} from '@dailyuse/contracts/reminder';

/**
 * Reminder Application Service
 */
export class ReminderApplicationService {
  private static instance: ReminderApplicationService;

  private constructor() {}

  static getInstance(): ReminderApplicationService {
    if (!ReminderApplicationService.instance) {
      ReminderApplicationService.instance = new ReminderApplicationService();
    }
    return ReminderApplicationService.instance;
  }

  // ===== Reminder Template Operations =====

  async createReminderTemplate(input: CreateReminderTemplateRequest): Promise<ReminderTemplateClientDTO> {
    const template = await CreateReminderTemplate.getInstance().execute(input);
    return template.toClientDTO();
  }

  async getReminderTemplate(templateId: string): Promise<ReminderTemplateClientDTO | null> {
    try {
      const template = await GetReminderTemplate.getInstance().execute(templateId);
      return template.toClientDTO();
    } catch {
      return null;
    }
  }

  async listReminderTemplates(params?: ListReminderTemplatesParams): Promise<ListReminderTemplatesResult> {
    const result = await ListReminderTemplates.getInstance().execute(params);
    // 确保返回正确的结构
    if (!result || !result.templates) {
      return {
        templates: [],
        total: 0,
        page: params?.page || 1,
        pageSize: params?.pageSize || 20,
        hasMore: false,
      };
    }
    return result;
  }

  async getUserTemplates(accountUuid: string) {
    return GetUserTemplates.getInstance().execute(accountUuid);
  }

  async updateReminderTemplate(templateId: string, input: UpdateReminderTemplateRequest): Promise<ReminderTemplateClientDTO> {
    const template = await UpdateReminderTemplate.getInstance().execute(templateId, input);
    return template.toClientDTO();
  }

  async deleteReminderTemplate(templateId: string): Promise<void> {
    return DeleteReminderTemplate.getInstance().execute(templateId);
  }

  async toggleTemplateEnabled(templateId: string): Promise<ReminderTemplateClientDTO> {
    const template = await ToggleTemplateEnabled.getInstance().execute(templateId);
    return template.toClientDTO();
  }

  async moveTemplateToGroup(templateUuid: string, targetGroupUuid: string | null): Promise<ReminderTemplateClientDTO> {
    const template = await MoveTemplateToGroup.getInstance().execute(templateUuid, targetGroupUuid);
    return template.toClientDTO();
  }

  async searchTemplates(accountUuid: string, query: string): Promise<ReminderTemplateClientDTO[]> {
    const templates = await SearchTemplates.getInstance().execute(accountUuid, query);
    return templates.map(t => t.toClientDTO());
  }

  async getTemplateScheduleStatus(templateId: string) {
    return GetTemplateScheduleStatus.getInstance().execute(templateId);
  }

  async getUpcomingReminders(params?: GetUpcomingRemindersParams) {
    return GetUpcomingReminders.getInstance().execute(params);
  }

  // ===== Reminder Group Operations =====

  async createReminderGroup(input: CreateReminderGroupRequest): Promise<ReminderGroupClientDTO> {
    const group = await CreateReminderGroup.getInstance().execute(input);
    return group.toClientDTO();
  }

  async getReminderGroup(groupId: string): Promise<ReminderGroupClientDTO | null> {
    try {
      const group = await GetReminderGroup.getInstance().execute(groupId);
      return group.toClientDTO();
    } catch {
      return null;
    }
  }

  async listReminderGroups(params?: ListReminderGroupsParams): Promise<ListReminderGroupsResult> {
    return ListReminderGroups.getInstance().execute(params);
  }

  async getUserReminderGroups(accountUuid: string) {
    return GetUserReminderGroups.getInstance().execute(accountUuid);
  }

  async updateReminderGroup(groupId: string, input: UpdateReminderGroupRequest): Promise<ReminderGroupClientDTO> {
    const group = await UpdateReminderGroup.getInstance().execute(groupId, input);
    return group.toClientDTO();
  }

  async deleteReminderGroup(groupId: string): Promise<void> {
    return DeleteReminderGroup.getInstance().execute(groupId);
  }

  async toggleReminderGroupStatus(groupId: string): Promise<ReminderGroupClientDTO> {
    const group = await ToggleReminderGroupStatus.getInstance().execute(groupId);
    return group.toClientDTO();
  }

  async toggleReminderGroupControlMode(groupId: string): Promise<ReminderGroupClientDTO> {
    const group = await ToggleReminderGroupControlMode.getInstance().execute(groupId);
    return group.toClientDTO();
  }

  // ===== Statistics =====

  async getReminderStatistics(accountUuid: string) {
    return GetReminderStatistics.getInstance().execute(accountUuid);
  }
}

// Singleton instance
export const reminderApplicationService = ReminderApplicationService.getInstance();
