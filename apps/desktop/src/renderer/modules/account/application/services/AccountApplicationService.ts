/**
 * Account Application Service - Renderer
 *
 * 账户应用服务 - 渲染进程
 *
 * 职责：
 * - 作为展示层与 Use Cases 之间的桥梁
 * - 调用 @dailyuse/application-client 的 Use Cases
 * - 不包含业务逻辑
 */

import {
  // Service Classes
  GetMyProfile,
  UpdateMyProfile,
  ChangeMyPassword,
  UpdateAccountPreferences,
  GetAccountById,
  GetSubscription,
  GetAccountStats,
} from '@dailyuse/application-client';
import type {
  AccountDTO,
  SubscriptionDTO,
  UpdateAccountPreferencesRequestDTO,
  AccountStatsResponseDTO,
  UpdateAccountProfileRequestDTO,
} from '@dailyuse/contracts/account';

/**
 * Change My Password Request
 */
export interface ChangeMyPasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Change My Password Result
 */
export interface ChangeMyPasswordResult {
  success: boolean;
  message: string;
}

/**
 * Account Application Service
 *
 * 渲染进程账户应用服务
 */
export class AccountApplicationService {
  private static instance: AccountApplicationService;

  private constructor() {}

  static getInstance(): AccountApplicationService {
    if (!AccountApplicationService.instance) {
      AccountApplicationService.instance = new AccountApplicationService();
    }
    return AccountApplicationService.instance;
  }

  // ===== Profile =====

  /**
   * 获取当前用户资料
   */
  async getMyProfile(): Promise<AccountDTO> {
    return GetMyProfile.getInstance().execute();
  }

  /**
   * 更新当前用户资料
   */
  async updateMyProfile(input: UpdateAccountProfileRequestDTO): Promise<AccountDTO> {
    return UpdateMyProfile.getInstance().execute(input);
  }

  /**
   * 修改密码
   */
  async changeMyPassword(input: ChangeMyPasswordRequest): Promise<ChangeMyPasswordResult> {
    return ChangeMyPassword.getInstance().execute(input);
  }

  /**
   * 获取指定账户
   */
  async getAccountById(accountId: string): Promise<AccountDTO | null> {
    try {
      return await GetAccountById.getInstance().execute(accountId);
    } catch {
      return null;
    }
  }

  // ===== Preferences =====

  /**
   * 更新账户偏好设置
   */
  async updatePreferences(
    accountId: string,
    request: UpdateAccountPreferencesRequestDTO,
  ): Promise<AccountDTO> {
    return UpdateAccountPreferences.getInstance().execute(accountId, request);
  }

  // ===== Subscription =====

  /**
   * 获取订阅信息
   */
  async getSubscription(accountId: string): Promise<SubscriptionDTO | null> {
    try {
      const result = await GetSubscription.getInstance().execute(accountId);
      return result;
    } catch {
      return null;
    }
  }

  // ===== Stats =====

  /**
   * 获取账户统计
   */
  async getAccountStats(): Promise<AccountStatsResponseDTO | null> {
    try {
      return await GetAccountStats.getInstance().execute();
    } catch {
      return null;
    }
  }
}

// 导出单例实例
export const accountApplicationService = AccountApplicationService.getInstance();
