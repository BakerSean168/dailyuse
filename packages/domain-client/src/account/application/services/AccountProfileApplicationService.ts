/**
 * Account Profile Application Service
 * 账户资料应用服务 - 负责账户资料相关的用例
 *
 * ✅ 框架无关的业务逻辑服务
 * - 只处理业务逻辑和 API 调用
 * - 只返回纯数据对象
 * - 可以在 Web、Desktop、Server 中使用
 *
 * @module domain-client/account/application/services
 */

import type {
  AccountDTO,
  UpdateAccountProfileRequestDTO,
  UpdateAccountPreferencesRequestDTO,
  UpdateEmailRequestDTO,
  VerifyEmailRequestDTO,
  UpdatePhoneRequestDTO,
  VerifyPhoneRequestDTO,
  AccountHistoryListResponseDTO,
} from '@dailyuse/contracts/account';
import type { IAccountApiClient } from '../../infrastructure/api/IAccountApiClient';

/**
 * 账户资料应用服务
 *
 * 依赖注入的 API 客户端，确保框架无关性
 */
export class AccountProfileApplicationService {
  constructor(private accountApiClient: IAccountApiClient) {}

  // ============ 当前用户资料管理用例 (/me) ============

  /**
   * 获取当前用户资料
   * @returns 返回账户资料
   */
  async getMyProfile(): Promise<AccountDTO> {
    return await this.accountApiClient.getMyProfile();
  }

  /**
   * 更新当前用户资料
   * @returns 返回更新后的账户资料
   */
  async updateMyProfile(request: UpdateAccountProfileRequestDTO): Promise<AccountDTO> {
    return await this.accountApiClient.updateMyProfile(request);
  }

  /**
   * 修改当前用户密码
   * @returns 返回操作结果
   */
  async changeMyPassword(request: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    return await this.accountApiClient.changeMyPassword(request);
  }

  // ============ 账户资料管理用例 ============

  /**
   * 获取账户详情
   * @returns 返回账户资料
   */
  async getAccountById(accountId: string): Promise<AccountDTO> {
    return await this.accountApiClient.getAccountById(accountId);
  }

  /**
   * 更新账户资料
   * @returns 返回更新后的账户资料
   */
  async updateProfile(
    accountId: string,
    request: UpdateAccountProfileRequestDTO,
  ): Promise<AccountDTO> {
    return await this.accountApiClient.updateProfile(accountId, request);
  }

  /**
   * 更新账户偏好
   * @returns 返回更新后的账户资料
   */
  async updatePreferences(
    accountId: string,
    request: UpdateAccountPreferencesRequestDTO,
  ): Promise<AccountDTO> {
    return await this.accountApiClient.updatePreferences(accountId, request);
  }

  // ============ 邮箱和手机号管理用例 ============

  /**
   * 更新邮箱
   * @returns 返回更新后的账户资料
   */
  async updateEmail(accountId: string, request: UpdateEmailRequestDTO): Promise<AccountDTO> {
    return await this.accountApiClient.updateEmail(accountId, request);
  }

  /**
   * 验证邮箱
   * @returns 返回更新后的账户资料
   */
  async verifyEmail(accountId: string, request: VerifyEmailRequestDTO): Promise<AccountDTO> {
    return await this.accountApiClient.verifyEmail(accountId, request);
  }

  /**
   * 更新手机号
   * @returns 返回更新后的账户资料
   */
  async updatePhone(accountId: string, request: UpdatePhoneRequestDTO): Promise<AccountDTO> {
    return await this.accountApiClient.updatePhone(accountId, request);
  }

  /**
   * 验证手机号
   * @returns 返回更新后的账户资料
   */
  async verifyPhone(accountId: string, request: VerifyPhoneRequestDTO): Promise<AccountDTO> {
    return await this.accountApiClient.verifyPhone(accountId, request);
  }

  // ============ 账户状态管理用例 ============

  /**
   * 停用账户
   * @returns 返回更新后的账户资料
   */
  async deactivateAccount(accountId: string): Promise<AccountDTO> {
    return await this.accountApiClient.deactivateAccount(accountId);
  }

  /**
   * 激活账户
   * @returns 返回更新后的账户资料
   */
  async activateAccount(accountId: string): Promise<AccountDTO> {
    return await this.accountApiClient.activateAccount(accountId);
  }

  /**
   * 删除账户
   */
  async deleteAccount(accountId: string): Promise<void> {
    return await this.accountApiClient.deleteAccount(accountId);
  }

  // ============ 账户历史查询用例 ============

  /**
   * 获取账户历史
   * @returns 返回账户历史记录
   */
  async getAccountHistory(
    accountId: string,
    params?: { page?: number; limit?: number },
  ): Promise<AccountHistoryListResponseDTO> {
    return await this.accountApiClient.getAccountHistory(accountId, params);
  }
}
