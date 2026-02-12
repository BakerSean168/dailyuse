/**
 * Reminder Template Application Service
 *
 * 提醒模板应用服务 - 负责模板的 CRUD 操作
 *
 * 设计说明：
 * - ApplicationService 只负责 API 调用和数据返回
 * - Store 操作由上层（Composable/Presenter）负责
 * - 完全解耦，便于测试和维护
 */

import type {
  ReminderTemplateClientDTO,
  CreateReminderTemplateRequest,
  UpdateReminderTemplateRequest,
  UpcomingRemindersResponseDTO,
  TemplateScheduleStatusDTO,
} from '@dailyuse/contracts/reminder';
import type {
  IReminderApiClient,
  ReminderTemplatesResponse,
} from '../../infrastructure-client/adapters/types';

/**
 * Reminder Template Application Service
 */
export class ReminderTemplateApplicationService {
  constructor(private readonly apiClient: IReminderApiClient) {}

  // ===== 模板 CRUD =====

  /**
   * 创建提醒模板
   */
  async createReminderTemplate(
    request: CreateReminderTemplateRequest,
  ): Promise<ReminderTemplateClientDTO> {
    return this.apiClient.createReminderTemplate(request);
  }

  /**
   * 获取提醒模板详情
   */
  async getReminderTemplate(uuid: string): Promise<ReminderTemplateClientDTO> {
    return this.apiClient.getReminderTemplate(uuid);
  }

  /**
   * 获取提醒模板列表
   */
  async getReminderTemplates(params?: {
    page?: number;
    limit?: number;
  }): Promise<ReminderTemplatesResponse> {
    return this.apiClient.getReminderTemplates(params);
  }

  /**
   * 获取用户的所有提醒模板
   */
  async getUserTemplates(accountUuid: string): Promise<ReminderTemplateClientDTO[]> {
    return this.apiClient.getUserTemplates(accountUuid);
  }

  /**
   * 更新提醒模板
   */
  async updateReminderTemplate(
    uuid: string,
    request: UpdateReminderTemplateRequest,
  ): Promise<ReminderTemplateClientDTO> {
    return this.apiClient.updateReminderTemplate(uuid, request);
  }

  /**
   * 删除提醒模板
   */
  async deleteReminderTemplate(uuid: string): Promise<void> {
    return this.apiClient.deleteReminderTemplate(uuid);
  }

  /**
   * 切换模板启用状态
   */
  async toggleTemplateEnabled(uuid: string): Promise<ReminderTemplateClientDTO> {
    return this.apiClient.toggleTemplateEnabled(uuid);
  }

  /**
   * 移动模板到指定分组
   */
  async moveTemplateToGroup(
    templateUuid: string,
    targetGroupUuid: string | null,
  ): Promise<ReminderTemplateClientDTO> {
    return this.apiClient.moveTemplateToGroup(templateUuid, targetGroupUuid);
  }

  /**
   * 搜索提醒模板
   */
  async searchTemplates(
    accountUuid: string,
    query: string,
  ): Promise<ReminderTemplateClientDTO[]> {
    return this.apiClient.searchTemplates(accountUuid, query);
  }

  /**
   * 获取模板的调度状态
   */
  async getTemplateScheduleStatus(templateUuid: string): Promise<TemplateScheduleStatusDTO> {
    return this.apiClient.getTemplateScheduleStatus(templateUuid);
  }

  /**
   * 获取即将到来的提醒
   */
  async getUpcomingReminders(params?: {
    days?: number;
    limit?: number;
    importanceLevel?: string;
    type?: string;
  }): Promise<UpcomingRemindersResponseDTO> {
    return this.apiClient.getUpcomingReminders(params);
  }
}

/**
 * Factory function to create ReminderTemplateApplicationService
 */
export function createReminderTemplateApplicationService(
  apiClient: IReminderApiClient,
): ReminderTemplateApplicationService {
  return new ReminderTemplateApplicationService(apiClient);
}
