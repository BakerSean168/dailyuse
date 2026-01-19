/**
 * Account Subscription Application Service
 * 账户订阅应用服务 - 负责订阅相关的用例
 *
 * ✅ 框架无关的业务逻辑服务
 * - 只处理业务逻辑和 API 调用
 * - 只返回纯数据对象
 * - 可以在 Web、Desktop、Server 中使用
 *
 * @module domain-client/account/application/services
 */

import type {
  SubscriptionDTO,
  SubscribePlanRequestDTO,
  CancelSubscriptionRequestDTO,
  AccountStatsResponseDTO,
} from '@dailyuse/contracts/account';
import type { IAccountApiClient } from '../../infrastructure/api/IAccountApiClient';

/**
 * 账户订阅应用服务
 *
 * 依赖注入的 API 客户端，确保框架无关性
 */
export class AccountSubscriptionApplicationService {
  constructor(private accountApiClient: IAccountApiClient) {}

  // ============ 订阅管理用例 ============

  /**
   * 获取订阅信息
   * @returns 返回订阅信息
   */
  async getSubscription(accountId: string): Promise<SubscriptionDTO> {
    return await this.accountApiClient.getSubscription(accountId);
  }

  /**
   * 订阅计划
   * @returns 返回订阅信息和更新后的账户资料
   */
  async subscribePlan(
    accountId: string,
    request: SubscribePlanRequestDTO,
  ): Promise<SubscriptionDTO> {
    return await this.accountApiClient.subscribePlan(accountId, request);
  }

  /**
   * 取消订阅
   * @returns 返回订阅信息
   */
  async cancelSubscription(
    accountId: string,
    request?: CancelSubscriptionRequestDTO,
  ): Promise<SubscriptionDTO> {
    return await this.accountApiClient.cancelSubscription(accountId, request);
  }

  // ============ 账户统计查询用例 ============

  /**
   * 获取账户统计
   * @returns 返回账户统计数据
   */
  async getAccountStats(): Promise<AccountStatsResponseDTO> {
    return await this.accountApiClient.getAccountStats();
  }
}
