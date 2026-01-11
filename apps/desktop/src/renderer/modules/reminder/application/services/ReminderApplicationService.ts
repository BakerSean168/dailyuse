/**
 * Reminder Application Service - Renderer
 *
 * 提醒应用服务 - 渲染进程
 */

import {
  // Reminder Template Use Cases
  createReminderTemplate,
  getReminderTemplate,
  listReminderTemplates,
  getUserTemplates,
  updateReminderTemplate,
  deleteReminderTemplate,
  toggleTemplateEnabled,
  moveTemplateToGroup,
  searchTemplates,
  getTemplateScheduleStatus,
  getUpcomingReminders,
  // Reminder Group Use Cases
  createReminderGroup,
  getReminderGroup,
  listReminderGroups,
  getUserReminderGroups,
  updateReminderGroup,
  deleteReminderGroup,
  toggleReminderGroupStatus,
  toggleReminderGroupControlMode,
  // Statistics
  getReminderStatistics,
  // Types
  type CreateReminderTemplateInput,
  type UpdateReminderTemplateInput,
  type ListReminderTemplatesParams,
  type ListReminderTemplatesResult,
  type MoveTemplateToGroupInput,
  type SearchTemplatesInput,
  type GetUpcomingRemindersParams,
  type CreateReminderGroupInput,
  type UpdateReminderGroupInput,
  type ListReminderGroupsParams,
  type ListReminderGroupsResult,
} from '@dailyuse/application-client';
import type {
  ReminderTemplateClientDTO,
  ReminderGroupClientDTO,
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

  async createReminderTemplate(input: CreateReminderTemplateInput): Promise<ReminderTemplateClientDTO> {
    return createReminderTemplate(input);
  }

  async getReminderTemplate(templateId: string): Promise<ReminderTemplateClientDTO | null> {
    try {
      return await getReminderTemplate(templateId);
    } catch {
      return null;
    }
  }

  async listReminderTemplates(params?: ListReminderTemplatesParams): Promise<ListReminderTemplatesResult> {
    const result = await listReminderTemplates(params);
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
    return getUserTemplates(accountUuid);
  }

  async updateReminderTemplate(input: UpdateReminderTemplateInput): Promise<ReminderTemplateClientDTO> {
    return updateReminderTemplate(input);
  }

  async deleteReminderTemplate(templateId: string): Promise<void> {
    return deleteReminderTemplate(templateId);
  }

  async toggleTemplateEnabled(templateId: string): Promise<ReminderTemplateClientDTO> {
    return toggleTemplateEnabled(templateId);
  }

  async moveTemplateToGroup(input: MoveTemplateToGroupInput): Promise<ReminderTemplateClientDTO> {
    return moveTemplateToGroup(input);
  }

  async searchTemplates(input: SearchTemplatesInput): Promise<ReminderTemplateClientDTO[]> {
    return searchTemplates(input);
  }

  async getTemplateScheduleStatus(templateId: string) {
    return getTemplateScheduleStatus(templateId);
  }

  async getUpcomingReminders(params?: GetUpcomingRemindersParams) {
    return getUpcomingReminders(params);
  }

  // ===== Reminder Group Operations =====

  async createReminderGroup(input: CreateReminderGroupInput): Promise<ReminderGroupClientDTO> {
    return createReminderGroup(input);
  }

  async getReminderGroup(groupId: string): Promise<ReminderGroupClientDTO | null> {
    try {
      return await getReminderGroup(groupId);
    } catch {
      return null;
    }
  }

  async listReminderGroups(params?: ListReminderGroupsParams): Promise<ListReminderGroupsResult> {
    return listReminderGroups(params);
  }

  async getUserReminderGroups(accountUuid: string) {
    return getUserReminderGroups(accountUuid);
  }

  async updateReminderGroup(input: UpdateReminderGroupInput): Promise<ReminderGroupClientDTO> {
    return updateReminderGroup(input);
  }

  async deleteReminderGroup(groupId: string): Promise<void> {
    return deleteReminderGroup(groupId);
  }

  async toggleReminderGroupStatus(groupId: string): Promise<ReminderGroupClientDTO> {
    return toggleReminderGroupStatus(groupId);
  }

  async toggleReminderGroupControlMode(groupId: string): Promise<ReminderGroupClientDTO> {
    return toggleReminderGroupControlMode(groupId);
  }

  // ===== Statistics =====

  async getReminderStatistics(accountUuid: string) {
    return getReminderStatistics(accountUuid);
  }
}

// Singleton instance
export const reminderApplicationService = ReminderApplicationService.getInstance();
