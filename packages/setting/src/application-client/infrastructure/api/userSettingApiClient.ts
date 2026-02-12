import { apiClient } from '@/shared/api/instances';
import type {
  UserSettingClientDTO,
  UpdateUserSettingRequest,
  CreateUserSettingRequest,
  UpdateAppearanceRequest,
  UpdateLocaleRequest,
  UpdateWorkflowRequest,
  UpdatePrivacyRequest,
  UpdateExperimentalRequest,
} from '@dailyuse/contracts/setting';

/**
 * UserSetting API 客户端
 * 负责与后端 /api/v1/user-settings 通信
 */
export class UserSettingApiClient {
  private readonly baseUrl = '/user-settings';

  // ===== UserSetting CRUD =====

  /**
   * 创建用户设置
   */
  async createUserSetting(
    request: CreateUserSettingRequest,
  ): Promise<UserSettingClientDTO> {
    const data = await apiClient.post(this.baseUrl, request);
    return data;
  }

  /**
   * 根据UUID获取用户设置
   */
  async getUserSettingByUuid(uuid: string): Promise<UserSettingClientDTO> {
    const data = await apiClient.get(`${this.baseUrl}/${uuid}`);
    return data;
  }

  /**
   * 根据账户UUID获取用户设置
   */
  async getUserSettingByAccount(
    accountUuid: string,
  ): Promise<UserSettingClientDTO> {
    const data = await apiClient.get(`${this.baseUrl}/account/${accountUuid}`);
    return data;
  }

  /**
   * 获取或创建用户设置（不存在时自动创建）
   */
  async getOrCreateUserSetting(
    accountUuid: string,
  ): Promise<UserSettingClientDTO> {
    const data = await apiClient.post(`${this.baseUrl}/get-or-create`, { accountUuid });
    return data;
  }

  /**
   * 完整更新用户设置
   */
  async updateUserSetting(
    uuid: string,
    request: UpdateUserSettingRequest,
  ): Promise<UserSettingClientDTO> {
    const data = await apiClient.put(`${this.baseUrl}/${uuid}`, request);
    return data;
  }

  /**
   * 删除用户设置
   */
  async deleteUserSetting(uuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${uuid}`);
  }

  // ===== Partial Updates =====

  /**
   * 更新外观设置
   */
  async updateAppearance(
    uuid: string,
    appearance: UpdateAppearanceRequest,
  ): Promise<UserSettingClientDTO> {
    const data = await apiClient.patch(`${this.baseUrl}/${uuid}/appearance`, { appearance });
    return data;
  }

  /**
   * 更新本地化设置
   */
  async updateLocale(
    uuid: string,
    locale: UpdateLocaleRequest,
  ): Promise<UserSettingClientDTO> {
    const data = await apiClient.patch(`${this.baseUrl}/${uuid}/locale`, { locale });
    return data;
  }

  /**
   * 更新工作流设置
   */
  async updateWorkflow(
    uuid: string,
    workflow: UpdateWorkflowRequest,
  ): Promise<UserSettingClientDTO> {
    const data = await apiClient.patch(`${this.baseUrl}/${uuid}/workflow`, { workflow });
    return data;
  }

  /**
   * 更新隐私设置
   */
  async updatePrivacy(
    uuid: string,
    privacy: UpdatePrivacyRequest,
  ): Promise<UserSettingClientDTO> {
    const data = await apiClient.patch(`${this.baseUrl}/${uuid}/privacy`, { privacy });
    return data;
  }

  /**
   * 更新实验性功能设置
   */
  async updateExperimental(
    uuid: string,
    experimental: UpdateExperimentalRequest,
  ): Promise<UserSettingClientDTO> {
    const data = await apiClient.patch(`${this.baseUrl}/${uuid}/experimental`, { experimental });
    return data;
  }

  // ===== Quick Actions =====

  /**
   * 快速切换主题
   */
  async updateTheme(uuid: string, theme: string): Promise<UserSettingClientDTO> {
    const data = await apiClient.patch(`${this.baseUrl}/${uuid}/theme`, { theme });
    return data;
  }

  /**
   * 快速切换语言
   */
  async updateLanguage(
    uuid: string,
    language: string,
  ): Promise<UserSettingClientDTO> {
    const data = await apiClient.patch(`${this.baseUrl}/${uuid}/language`, { language });
    return data;
  }

  // ===== Shortcut Management =====

  /**
   * 更新单个快捷键
   */
  async updateShortcut(
    uuid: string,
    action: string,
    shortcut: string,
  ): Promise<UserSettingClientDTO> {
    const data = await apiClient.patch(`${this.baseUrl}/${uuid}/shortcuts/${action}`, {
      shortcut,
    });
    return data;
  }

  /**
   * 删除单个快捷键
   */
  async deleteShortcut(
    uuid: string,
    action: string,
  ): Promise<UserSettingClientDTO> {
    const data = await apiClient.delete(`${this.baseUrl}/${uuid}/shortcuts/${action}`);
    return data;
  }
}

// 导出单例实例
export const userSettingApiClient = new UserSettingApiClient();

