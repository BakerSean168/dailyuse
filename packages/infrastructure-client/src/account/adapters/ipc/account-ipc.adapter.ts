/**
 * Account IPC Adapter
 *
 * IPC implementation of IAccountApiClient for Electron desktop apps.
 */

import type { IAccountApiClient } from '../../ports/account-api-client.port';
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
 * IPC channel definitions for Account operations
 */
const ACCOUNT_CHANNELS = {
  // CRUD
  CREATE_ACCOUNT: 'account:create',
  GET_ACCOUNT: 'account:get',
  GET_ACCOUNTS: 'account:get-all',
  DELETE_ACCOUNT: 'account:delete',
  // Current User (/me)
  GET_MY_PROFILE: 'account:me:get',
  UPDATE_MY_PROFILE: 'account:me:update',
  CHANGE_MY_PASSWORD: 'account:me:change-password',
  // Profile Management
  UPDATE_PROFILE: 'account:profile:update',
  UPDATE_PREFERENCES: 'account:preferences:update',
  // Email/Phone
  UPDATE_EMAIL: 'account:email:update',
  VERIFY_EMAIL: 'account:email:verify',
  UPDATE_PHONE: 'account:phone:update',
  VERIFY_PHONE: 'account:phone:verify',
  // Status Management
  DEACTIVATE: 'account:deactivate',
  SUSPEND: 'account:suspend',
  ACTIVATE: 'account:activate',
  // Subscription
  GET_SUBSCRIPTION: 'account:subscription:get',
  SUBSCRIBE_PLAN: 'account:subscription:subscribe',
  CANCEL_SUBSCRIPTION: 'account:subscription:cancel',
  // History & Stats
  GET_HISTORY: 'account:history:get',
  GET_STATS: 'account:stats:get',
} as const;

/**
 * IPC API interface for Electron renderer process
 */
interface IpcApi {
  invoke<T>(channel: string, ...args: unknown[]): Promise<T>;
}

/**
 * AccountIpcAdapter
 *
 * IPC 实现的账户 API 客户端（用于 Electron 桌面应用）
 */
export class AccountIpcAdapter implements IAccountApiClient {
  constructor(private readonly ipcApi: IpcApi) {}

  // ===== 账户 CRUD =====

  async createAccount(request: CreateAccountRequestDTO): Promise<AccountDTO> {
    return this.ipcApi.invoke(ACCOUNT_CHANNELS.CREATE_ACCOUNT, request);
  }

  async getAccountById(accountId: string): Promise<AccountDTO> {
    return this.ipcApi.invoke(ACCOUNT_CHANNELS.GET_ACCOUNT, accountId);
  }

  async getAccounts(params?: AccountQueryParams): Promise<AccountListResponseDTO> {
    return this.ipcApi.invoke(ACCOUNT_CHANNELS.GET_ACCOUNTS, params);
  }

  async deleteAccount(accountId: string): Promise<void> {
    await this.ipcApi.invoke(ACCOUNT_CHANNELS.DELETE_ACCOUNT, accountId);
  }

  // ===== 当前用户资料（/me 端点）=====

  async getMyProfile(): Promise<AccountDTO> {
    return this.ipcApi.invoke(ACCOUNT_CHANNELS.GET_MY_PROFILE);
  }

  async updateMyProfile(request: UpdateAccountProfileRequestDTO): Promise<AccountDTO> {
    return this.ipcApi.invoke(ACCOUNT_CHANNELS.UPDATE_MY_PROFILE, request);
  }

  async changeMyPassword(request: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ActionResult> {
    return this.ipcApi.invoke(ACCOUNT_CHANNELS.CHANGE_MY_PASSWORD, request);
  }

  // ===== 账户资料管理 =====

  async updateProfile(
    accountId: string,
    request: UpdateAccountProfileRequestDTO,
  ): Promise<AccountDTO> {
    return this.ipcApi.invoke(ACCOUNT_CHANNELS.UPDATE_PROFILE, accountId, request);
  }

  async updatePreferences(
    accountId: string,
    request: UpdateAccountPreferencesRequestDTO,
  ): Promise<AccountDTO> {
    return this.ipcApi.invoke(ACCOUNT_CHANNELS.UPDATE_PREFERENCES, accountId, request);
  }

  // ===== 邮箱和手机号管理 =====

  async updateEmail(accountId: string, request: UpdateEmailRequestDTO): Promise<AccountDTO> {
    return this.ipcApi.invoke(ACCOUNT_CHANNELS.UPDATE_EMAIL, accountId, request);
  }

  async verifyEmail(accountId: string, request: VerifyEmailRequestDTO): Promise<AccountDTO> {
    return this.ipcApi.invoke(ACCOUNT_CHANNELS.VERIFY_EMAIL, accountId, request);
  }

  async updatePhone(accountId: string, request: UpdatePhoneRequestDTO): Promise<AccountDTO> {
    return this.ipcApi.invoke(ACCOUNT_CHANNELS.UPDATE_PHONE, accountId, request);
  }

  async verifyPhone(accountId: string, request: VerifyPhoneRequestDTO): Promise<AccountDTO> {
    return this.ipcApi.invoke(ACCOUNT_CHANNELS.VERIFY_PHONE, accountId, request);
  }

  // ===== 账户状态管理 =====

  async deactivateAccount(accountId: string): Promise<AccountDTO> {
    return this.ipcApi.invoke(ACCOUNT_CHANNELS.DEACTIVATE, accountId);
  }

  async suspendAccount(accountId: string): Promise<AccountDTO> {
    return this.ipcApi.invoke(ACCOUNT_CHANNELS.SUSPEND, accountId);
  }

  async activateAccount(accountId: string): Promise<AccountDTO> {
    return this.ipcApi.invoke(ACCOUNT_CHANNELS.ACTIVATE, accountId);
  }

  // ===== 订阅管理 =====

  async getSubscription(accountId: string): Promise<SubscriptionDTO> {
    return this.ipcApi.invoke(ACCOUNT_CHANNELS.GET_SUBSCRIPTION, accountId);
  }

  async subscribePlan(
    accountId: string,
    request: SubscribePlanRequestDTO,
  ): Promise<SubscriptionDTO> {
    return this.ipcApi.invoke(ACCOUNT_CHANNELS.SUBSCRIBE_PLAN, accountId, request);
  }

  async cancelSubscription(
    accountId: string,
    request?: CancelSubscriptionRequestDTO,
  ): Promise<SubscriptionDTO> {
    return this.ipcApi.invoke(ACCOUNT_CHANNELS.CANCEL_SUBSCRIPTION, accountId, request);
  }

  // ===== 账户历史 =====

  async getAccountHistory(
    accountId: string,
    params?: { page?: number; limit?: number },
  ): Promise<AccountHistoryListResponseDTO> {
    return this.ipcApi.invoke(ACCOUNT_CHANNELS.GET_HISTORY, accountId, params);
  }

  // ===== 账户统计 =====

  async getAccountStats(): Promise<AccountStatsResponseDTO> {
    return this.ipcApi.invoke(ACCOUNT_CHANNELS.GET_STATS);
  }

  // ===== 向后兼容别名 =====

  /**
   * @deprecated 请使用 getMyProfile()
   */
  async getCurrentAccount(): Promise<AccountDTO> {
    return this.getMyProfile();
  }

  /**
   * @deprecated 请使用 getAccountHistory()
   */
  async getHistory(
    params?: { page?: number; limit?: number },
  ): Promise<AccountHistoryListResponseDTO> {
    // 使用“me”作为 accountId 代表当前用户
    return this.getAccountHistory('me', params);
  }

  /**
   * @deprecated 请使用 getAccountStats()
   */
  async getStats(_accountUuid?: string): Promise<AccountStatsResponseDTO> {
    return this.getAccountStats();
  }
}

/**
 * Factory function to create AccountIpcAdapter
 */
export function createAccountIpcAdapter(ipcApi: IpcApi): AccountIpcAdapter {
  return new AccountIpcAdapter(ipcApi);
}
