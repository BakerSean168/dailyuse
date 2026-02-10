/**
 * Reminder Group Application Service
 *
 * 提醒分组应用服务 - 负责分组管理
 *
 * 设计说明：
 * - ApplicationService 只负责 API 调用和数据返回
 * - Store 操作由上层（Composable/Presenter）负责
 */

import type {
  ReminderGroupClientDTO,
  CreateReminderGroupRequest,
  UpdateReminderGroupRequest,
} from '@dailyuse/contracts/reminder';
import type {
  IReminderApiClient,
  ReminderGroupsResponse,
} from '@/infrastructure-client';

/**
 * Reminder Group Application Service
 */
export class ReminderGroupApplicationService {
  constructor(private readonly apiClient: IReminderApiClient) {}

  /**
   * 创建提醒分组
   */
  async createReminderGroup(
    request: CreateReminderGroupRequest,
  ): Promise<ReminderGroupClientDTO> {
    return this.apiClient.createReminderGroup(request);
  }

  /**
   * 获取分组详情
   */
  async getReminderGroup(uuid: string): Promise<ReminderGroupClientDTO> {
    return this.apiClient.getReminderGroup(uuid);
  }

  /**
   * 获取分组列表
   */
  async getReminderGroups(params?: {
    page?: number;
    limit?: number;
  }): Promise<ReminderGroupsResponse> {
    return this.apiClient.getReminderGroups(params);
  }

  /**
   * 获取指定用户的所有分组
   */
  async getUserReminderGroups(accountUuid: string): Promise<ReminderGroupClientDTO[]> {
    return this.apiClient.getUserReminderGroups(accountUuid);
  }

  /**
   * 更新分组
   */
  async updateReminderGroup(
    uuid: string,
    request: UpdateReminderGroupRequest,
  ): Promise<ReminderGroupClientDTO> {
    return this.apiClient.updateReminderGroup(uuid, request);
  }

  /**
   * 删除分组
   */
  async deleteReminderGroup(uuid: string): Promise<void> {
    return this.apiClient.deleteReminderGroup(uuid);
  }

  /**
   * 切换分组启用状态
   */
  async toggleReminderGroupStatus(uuid: string): Promise<ReminderGroupClientDTO> {
    return this.apiClient.toggleReminderGroupStatus(uuid);
  }

  /**
   * 切换分组控制模式
   */
  async toggleReminderGroupControlMode(uuid: string): Promise<ReminderGroupClientDTO> {
    return this.apiClient.toggleReminderGroupControlMode(uuid);
  }
}

/**
 * Factory function to create ReminderGroupApplicationService
 */
export function createReminderGroupApplicationService(
  apiClient: IReminderApiClient,
): ReminderGroupApplicationService {
  return new ReminderGroupApplicationService(apiClient);
}
