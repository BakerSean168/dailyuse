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
  async getUserSettingById(id: string): Promise<UserSettingClientDTO> {
    const data = await apiClient.get(`${this.baseUrl}/${id}`);
    return data;
  }

  /**
   * 根据账户 ID获取用户设置
   */
  async getUserSettingByAccount(
    identityId: string,
  ): Promise<UserSettingClientDTO> {
    const data = await apiClient.get(`${this.baseUrl}/account/${identityId}`);
    return data;
  }

  /**
   * 获取或创建用户设置（不存在时自动创建）
   */
  async getOrCreateUserSetting(
    identityId: string,
  ): Promise<UserSettingClientDTO> {
    const data = await apiClient.post(`${this.baseUrl}/get-or-create`, { identityId });
    return data;
  }

  /**
   * 完整更新用户设置
   */
  async updateUserSetting(
    id: string,
    request: UpdateUserSettingRequest,
  ): Promise<UserSettingClientDTO> {
    const data = await apiClient.put(`${this.baseUrl}/${id}`, request);
    return data;
  }

  /**
   * 删除用户设置
   */
  async deleteUserSetting(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  // ===== Partial Updates =====

  /**
   * 更新外观设置
   */
  async updateAppearance(
    id: string,
    appearance: UpdateAppearanceRequest,
  ): Promise<UserSettingClientDTO> {
    const data = await apiClient.patch(`${this.baseUrl}/${id}/appearance`, { appearance });
    return data;
  }

  /**
   * 更新本地化设置
   */
  async updateLocale(
    id: string,
    locale: UpdateLocaleRequest,
  ): Promise<UserSettingClientDTO> {
    const data = await apiClient.patch(`${this.baseUrl}/${id}/locale`, { locale });
    return data;
  }

  /**
   * 更新工作流设置
   */
  async updateWorkflow(
    id: string,
    workflow: UpdateWorkflowRequest,
  ): Promise<UserSettingClientDTO> {
    const data = await apiClient.patch(`${this.baseUrl}/${id}/workflow`, { workflow });
    return data;
  }

  /**
   * 更新隐私设置
   */
  async updatePrivacy(
    id: string,
    privacy: UpdatePrivacyRequest,
  ): Promise<UserSettingClientDTO> {
    const data = await apiClient.patch(`${this.baseUrl}/${id}/privacy`, { privacy });
    return data;
  }

  /**
   * 更新实验性功能设置
   */
  async updateExperimental(
    id: string,
    experimental: UpdateExperimentalRequest,
  ): Promise<UserSettingClientDTO> {
    const data = await apiClient.patch(`${this.baseUrl}/${id}/experimental`, { experimental });
    return data;
  }

  // ===== Quick Actions =====

  /**
   * 快速切换主题
   */
  async updateTheme(id: string, theme: string): Promise<UserSettingClientDTO> {
    const data = await apiClient.patch(`${this.baseUrl}/${id}/theme`, { theme });
    return data;
  }

  /**
   * 快速切换语言
   */
  async updateLanguage(
    id: string,
    language: string,
  ): Promise<UserSettingClientDTO> {
    const data = await apiClient.patch(`${this.baseUrl}/${id}/language`, { language });
    return data;
  }

  // ===== Shortcut Management =====

  /**
   * 更新单个快捷键
   */
  async updateShortcut(
    id: string,
    action: string,
    shortcut: string,
  ): Promise<UserSettingClientDTO> {
    const data = await apiClient.patch(`${this.baseUrl}/${id}/shortcuts/${action}`, {
      shortcut,
    });
    return data;
  }

  /**
   * 删除单个快捷键
   */
  async deleteShortcut(
    id: string,
    action: string,
  ): Promise<UserSettingClientDTO> {
    const data = await apiClient.delete(`${this.baseUrl}/${id}/shortcuts/${action}`);
    return data;
  }
}

// 导出单例实例
export const userSettingApiClient = new UserSettingApiClient();

