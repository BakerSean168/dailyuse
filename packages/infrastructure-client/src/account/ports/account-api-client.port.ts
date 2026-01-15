/**
 * Account API Client Port Interface
 *
 * 定义账户模块的 API 客户端接口。
 * 包含账户 CRUD、资料管理、订阅管理等功能。
 */

import type {
  AccountDTO,
  AccountListResponseDTO,
  AccountQueryParams,
  AccountStatsResponseDTO,
  AccountHistoryListResponseDTO,
  SubscriptionDTO,
  CreateAccountRequestDTO,
  UpdateAccountProfileRequestDTO,
  UpdateAccountPreferencesRequestDTO,
  UpdateEmailRequestDTO,
  VerifyEmailRequestDTO,
  UpdatePhoneRequestDTO,
  VerifyPhoneRequestDTO,
  SubscribePlanRequestDTO,
  CancelSubscriptionRequestDTO,
} from '@dailyuse/contracts/account';
import type { ActionResult } from '@dailyuse/contracts/result';

/**
 * IAccountApiClient
 *
 * 账户模块 API 客户端接口
 */
export interface IAccountApiClient {
  // ===== 账户 CRUD =====

  /**
   * 创建账户
   */
  createAccount(request: CreateAccountRequestDTO): Promise<AccountDTO>;

  /**
   * 获取账户详情
   */
  getAccountById(accountId: string): Promise<AccountDTO>;

  /**
   * 获取账户列表
   */
  getAccounts(params?: AccountQueryParams): Promise<AccountListResponseDTO>;

  /**
   * 删除账户（软删除）
   */
  deleteAccount(accountId: string): Promise<void>;

  // ===== 当前用户资料（/me 端点）=====

  /**
   * 获取当前用户资料
   */
  getMyProfile(): Promise<AccountDTO>;

  /**
   * 更新当前用户资料
   */
  updateMyProfile(request: UpdateAccountProfileRequestDTO): Promise<AccountDTO>;

  /**
   * 修改当前用户密码
   * @returns ActionResult 操作结果，包含成功/失败消息
   */
  changeMyPassword(request: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ActionResult>;

  // ===== 账户资料管理 =====

  /**
   * 更新账户资料
   */
  updateProfile(
    accountId: string,
    request: UpdateAccountProfileRequestDTO,
  ): Promise<AccountDTO>;

  /**
   * 更新账户偏好
   */
  updatePreferences(
    accountId: string,
    request: UpdateAccountPreferencesRequestDTO,
  ): Promise<AccountDTO>;

  // ===== 邮箱和手机号管理 =====

  /**
   * 更新邮箱
   */
  updateEmail(accountId: string, request: UpdateEmailRequestDTO): Promise<AccountDTO>;

  /**
   * 验证邮箱
   */
  verifyEmail(accountId: string, request: VerifyEmailRequestDTO): Promise<AccountDTO>;

  /**
   * 更新手机号
   */
  updatePhone(accountId: string, request: UpdatePhoneRequestDTO): Promise<AccountDTO>;

  /**
   * 验证手机号
   */
  verifyPhone(accountId: string, request: VerifyPhoneRequestDTO): Promise<AccountDTO>;

  // ===== 账户状态管理 =====

  /**
   * 停用账户
   */
  deactivateAccount(accountId: string): Promise<AccountDTO>;

  /**
   * 暂停账户
   */
  suspendAccount(accountId: string): Promise<AccountDTO>;

  /**
   * 激活账户
   */
  activateAccount(accountId: string): Promise<AccountDTO>;

  // ===== 订阅管理 =====

  /**
   * 获取订阅信息
   */
  getSubscription(accountId: string): Promise<SubscriptionDTO>;

  /**
   * 订阅计划
   */
  subscribePlan(accountId: string, request: SubscribePlanRequestDTO): Promise<SubscriptionDTO>;

  /**
   * 取消订阅
   */
  cancelSubscription(
    accountId: string,
    request?: CancelSubscriptionRequestDTO,
  ): Promise<SubscriptionDTO>;

  // ===== 账户历史 =====

  /**
   * 获取账户历史
   */
  getAccountHistory(
    accountId: string,
    params?: { page?: number; limit?: number },
  ): Promise<AccountHistoryListResponseDTO>;

  // ===== 账户统计 =====

  /**
   * 获取账户统计
   */
  getAccountStats(): Promise<AccountStatsResponseDTO>;

  // ===== 向后兼容别名 =====

  /**
   * @deprecated 请使用 getMyProfile()
   */
  getCurrentAccount(): Promise<AccountDTO>;

  /**
   * @deprecated 请使用 getAccountHistory()
   */
  getHistory(params?: { page?: number; limit?: number }): Promise<AccountHistoryListResponseDTO>;

  /**
   * @deprecated 请使用 getAccountStats()
   */
  getStats(accountUuid?: string): Promise<AccountStatsResponseDTO>;
}
