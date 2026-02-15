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
  ReminderStatsClientDTO,
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

  async getReminderTemplate(uuid: string): Promise<Result<ReminderTemplateClientDTO>> {
    return this.reminderApi.getReminderTemplate(uuid);
  }

  async getReminderTemplates(params?: { page?: number; limit?: number }): Promise<Result<ReminderTemplatesResponse>> {
    return this.reminderApi.getReminderTemplates(params);
  }

  async getUserTemplates(accountUuid: string): Promise<Result<ReminderTemplateClientDTO[]>> {
    return this.reminderApi.getUserTemplates(accountUuid);
  }

  async updateReminderTemplate(uuid: string, request: UpdateReminderTemplateReq): Promise<Result<ReminderTemplateClientDTO>> {
    return this.reminderApi.updateReminderTemplate(uuid, request);
  }

  async deleteReminderTemplate(uuid: string): Promise<Result<void>> {
    return this.reminderApi.deleteReminderTemplate(uuid);
  }

  async toggleTemplateEnabled(uuid: string): Promise<Result<ReminderTemplateClientDTO>> {
    return this.reminderApi.toggleTemplateEnabled(uuid);
  }

  async moveTemplateToGroup(templateUuid: string, targetGroupUuid: string | null): Promise<Result<ReminderTemplateClientDTO>> {
    return this.reminderApi.moveTemplateToGroup(templateUuid, targetGroupUuid);
  }

  async searchTemplates(accountUuid: string, query: string): Promise<Result<ReminderTemplateClientDTO[]>> {
    return this.reminderApi.searchTemplates(accountUuid, query);
  }

  async getTemplateScheduleStatus(templateUuid: string): Promise<Result<TemplateScheduleStatusRes>> {
    return this.reminderApi.getTemplateScheduleStatus(templateUuid);
  }

  async getUpcomingReminders(params?: { days?: number; limit?: number; importanceLevel?: string; type?: string }): Promise<Result<GetUpcomingRemindersRes>> {
    return this.reminderApi.getUpcomingReminders(params);
  }

  // ===== 分组 CRUD =====

  async createReminderGroup(request: CreateReminderGroupReq): Promise<Result<ReminderGroupClientDTO>> {
    return this.reminderApi.createReminderGroup(request);
  }

  async getReminderGroup(uuid: string): Promise<Result<ReminderGroupClientDTO>> {
    return this.reminderApi.getReminderGroup(uuid);
  }

  async getReminderGroups(params?: { page?: number; limit?: number }): Promise<Result<ReminderGroupsResponse>> {
    return this.reminderApi.getReminderGroups(params);
  }

  async getUserReminderGroups(accountUuid: string): Promise<Result<ReminderGroupClientDTO[]>> {
    return this.reminderApi.getUserReminderGroups(accountUuid);
  }

  async updateReminderGroup(uuid: string, request: UpdateReminderGroupReq): Promise<Result<ReminderGroupClientDTO>> {
    return this.reminderApi.updateReminderGroup(uuid, request);
  }

  async deleteReminderGroup(uuid: string): Promise<Result<void>> {
    return this.reminderApi.deleteReminderGroup(uuid);
  }

  async toggleReminderGroupStatus(uuid: string): Promise<Result<ReminderGroupClientDTO>> {
    return this.reminderApi.toggleReminderGroupStatus(uuid);
  }

  async toggleReminderGroupControlMode(uuid: string): Promise<Result<ReminderGroupClientDTO>> {
    return this.reminderApi.toggleReminderGroupControlMode(uuid);
  }

  // ===== 统计 =====

  async getReminderStatistics(accountUuid: string): Promise<Result<ReminderStatsClientDTO>> {
    return this.reminderApi.getReminderStatistics(accountUuid);
  }
}
