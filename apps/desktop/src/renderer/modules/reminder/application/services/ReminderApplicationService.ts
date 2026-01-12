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
import { ReminderTemplate, ReminderGroup } from '@dailyuse/domain-client/reminder';

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
  templates: ReminderTemplate[];
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
  groups: ReminderGroup[];
  total: number;
  page: number;
  pageSize: number;
}
import type {
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

  async createReminderTemplate(input: CreateReminderTemplateRequest): Promise<ReminderTemplate> {
    return CreateReminderTemplate.getInstance().execute(input);
  }

  async getReminderTemplate(templateId: string): Promise<ReminderTemplate | null> {
    try {
      return await GetReminderTemplate.getInstance().execute(templateId);
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

  async updateReminderTemplate(templateId: string, input: UpdateReminderTemplateRequest): Promise<ReminderTemplate> {
    return UpdateReminderTemplate.getInstance().execute(templateId, input);
  }

  async deleteReminderTemplate(templateId: string): Promise<void> {
    return DeleteReminderTemplate.getInstance().execute(templateId);
  }

  async toggleTemplateEnabled(templateId: string): Promise<ReminderTemplate> {
    return ToggleTemplateEnabled.getInstance().execute(templateId);
  }

  async moveTemplateToGroup(templateUuid: string, targetGroupUuid: string | null): Promise<ReminderTemplate> {
    return MoveTemplateToGroup.getInstance().execute(templateUuid, targetGroupUuid);
  }

  async searchTemplates(accountUuid: string, query: string): Promise<ReminderTemplate[]> {
    return SearchTemplates.getInstance().execute(accountUuid, query);
  }

  async getTemplateScheduleStatus(templateId: string) {
    return GetTemplateScheduleStatus.getInstance().execute(templateId);
  }

  async getUpcomingReminders(params?: GetUpcomingRemindersParams) {
    return GetUpcomingReminders.getInstance().execute(params);
  }

  // ===== Reminder Group Operations =====

  async createReminderGroup(input: CreateReminderGroupRequest): Promise<ReminderGroup> {
    return CreateReminderGroup.getInstance().execute(input);
  }

  async getReminderGroup(groupId: string): Promise<ReminderGroup | null> {
    try {
      return await GetReminderGroup.getInstance().execute(groupId);
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

  async updateReminderGroup(groupId: string, input: UpdateReminderGroupRequest): Promise<ReminderGroup> {
    return UpdateReminderGroup.getInstance().execute(groupId, input);
  }

  async deleteReminderGroup(groupId: string): Promise<void> {
    return DeleteReminderGroup.getInstance().execute(groupId);
  }

  async toggleReminderGroupStatus(groupId: string): Promise<ReminderGroup> {
    return ToggleReminderGroupStatus.getInstance().execute(groupId);
  }

  async toggleReminderGroupControlMode(groupId: string): Promise<ReminderGroup> {
    return ToggleReminderGroupControlMode.getInstance().execute(groupId);
  }

  // ===== Statistics =====

  async getReminderStatistics(accountUuid: string) {
    return GetReminderStatistics.getInstance().execute(accountUuid);
  }
}

// Singleton instance
export const reminderApplicationService = ReminderApplicationService.getInstance();
