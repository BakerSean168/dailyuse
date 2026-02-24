/**
 * @deprecated Extract operations to individual service files following governance pattern.
 * Each API operation should have its own service file for better maintainability.
 */

/**
 * Reminder Client Service
 *
 * Constructor-injected application service for reminder management.
 * Uses port interfaces directly, returning Result<T> types throughout.
 *
 * @module application-client/reminder-client-service
 */

import type { Result } from '@dailyuse/contracts/result';
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
import type {
  IReminderApiClient,
  ReminderTemplatesResponse,
  ReminderGroupsResponse,
} from '../infrastructure-client/adapters/types';

export class ReminderClientService {
  constructor(
    private readonly reminderApi: IReminderApiClient,
  ) {}

  // ===== 模板 CRUD =====

  async createReminderTemplate(request: CreateReminderTemplateReq): Promise<Result<ReminderTemplateClientDTO>> {
    return this.reminderApi.createReminderTemplate(request);
  }

  async getReminderTemplate(id: string): Promise<Result<ReminderTemplateClientDTO>> {
    return this.reminderApi.getReminderTemplate(id);
  }

  async getReminderTemplates(params?: { page?: number; limit?: number }): Promise<Result<ReminderTemplatesResponse>> {
    return this.reminderApi.getReminderTemplates(params);
  }

  async getUserTemplates(identityId: string): Promise<Result<ReminderTemplateClientDTO[]>> {
    return this.reminderApi.getUserTemplates(identityId);
  }

  async updateReminderTemplate(id: string, request: UpdateReminderTemplateReq): Promise<Result<ReminderTemplateClientDTO>> {
    return this.reminderApi.updateReminderTemplate(id, request);
  }

  async deleteReminderTemplate(id: string): Promise<Result<void>> {
    return this.reminderApi.deleteReminderTemplate(id);
  }

  async toggleTemplateEnabled(id: string): Promise<Result<ReminderTemplateClientDTO>> {
    return this.reminderApi.toggleTemplateEnabled(id);
  }

  async moveTemplateToGroup(templateId: string, targetGroupId: string | null): Promise<Result<ReminderTemplateClientDTO>> {
    return this.reminderApi.moveTemplateToGroup(templateId, targetGroupId);
  }

  async searchTemplates(identityId: string, query: string): Promise<Result<ReminderTemplateClientDTO[]>> {
    return this.reminderApi.searchTemplates(identityId, query);
  }

  async getTemplateScheduleStatus(templateId: string): Promise<Result<TemplateScheduleStatusRes>> {
    return this.reminderApi.getTemplateScheduleStatus(templateId);
  }

  async getUpcomingReminders(params?: { days?: number; limit?: number; importanceLevel?: string; type?: string }): Promise<Result<GetUpcomingRemindersRes>> {
    return this.reminderApi.getUpcomingReminders(params);
  }

  // ===== 分组 CRUD =====

  async createReminderGroup(request: CreateReminderGroupReq): Promise<Result<ReminderGroupClientDTO>> {
    return this.reminderApi.createReminderGroup(request);
  }

  async getReminderGroup(id: string): Promise<Result<ReminderGroupClientDTO>> {
    return this.reminderApi.getReminderGroup(id);
  }

  async getReminderGroups(params?: { page?: number; limit?: number }): Promise<Result<ReminderGroupsResponse>> {
    return this.reminderApi.getReminderGroups(params);
  }

  async getUserReminderGroups(identityId: string): Promise<Result<ReminderGroupClientDTO[]>> {
    return this.reminderApi.getUserReminderGroups(identityId);
  }

  async updateReminderGroup(id: string, request: UpdateReminderGroupReq): Promise<Result<ReminderGroupClientDTO>> {
    return this.reminderApi.updateReminderGroup(id, request);
  }

  async deleteReminderGroup(id: string): Promise<Result<void>> {
    return this.reminderApi.deleteReminderGroup(id);
  }

  async toggleReminderGroupStatus(id: string): Promise<Result<ReminderGroupClientDTO>> {
    return this.reminderApi.toggleReminderGroupStatus(id);
  }

  async toggleReminderGroupControlMode(id: string): Promise<Result<ReminderGroupClientDTO>> {
    return this.reminderApi.toggleReminderGroupControlMode(id);
  }
}
