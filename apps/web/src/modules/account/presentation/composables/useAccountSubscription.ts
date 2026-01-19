/**
 * Account Subscription Composable
 * 账户订阅组合式 API
 *
 * 职责:
 * - 调用 AccountSubscriptionApplicationService 获取数据
 * - 管理 Pinia Store 中的订阅状态
 * - 处理订阅计划管理和统计数据
 * - 为组件提供响应式的订阅操作接口
 *
 * EPIC-018 重构:
 * - Service 只返回纯数据
 * - Composable 负责 Store 操作
 * - 组件使用 Composable，不直接调用 Service
 */

import { computed } from 'vue';
import { useAccountStore } from '../stores/accountStore';
import type {
  SubscriptionDTO,
  SubscribePlanRequestDTO,
  AccountStatsResponseDTO,
} from '@dailyuse/contracts/account';
import {
  GetSubscription,
  SubscribePlan,
  CancelSubscription,
  GetAccountStats,
} from '@dailyuse/application-client/account';

export function useAccountSubscription() {
  const accountStore = useAccountStore();

  // Use Cases from application-client
  const getSubscriptionUseCase = GetSubscription.getInstance();
  const subscribePlanUseCase = SubscribePlan.getInstance();
  const cancelSubscriptionUseCase = CancelSubscription.getInstance();
  const getAccountStatsUseCase = GetAccountStats.getInstance();

  // ============ State (from store) ============
  const subscription = computed(() => accountStore.subscription);
  const accountStats = computed(() => accountStore.accountStats);
  const isLoading = computed(() => accountStore.isLoading);
  const error = computed(() => accountStore.error);

  // ============ Subscription Methods ============

  /**
   * 获取当前订阅信息
   */
  async function loadSubscription(): Promise<SubscriptionDTO | null> {
    accountStore.setLoading(true);
    try {
      const sub = await getSubscriptionUseCase.execute();
      accountStore.setSubscription(sub);
      accountStore.setError(null);
      return sub;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取订阅信息失败';
      accountStore.setError(errorMessage);
      console.error('❌ [useAccountSubscription] 获取订阅信息失败:', err);
      return null;
    } finally {
      accountStore.setLoading(false);
    }
  }

  /**
   * 订阅计划
   */
  async function subscribePlan(request: SubscribePlanRequestDTO): Promise<SubscriptionDTO | null> {
    accountStore.setLoading(true);
    try {
      const sub = await subscribePlanUseCase.execute(request);
      accountStore.setSubscription(sub);
      accountStore.setError(null);
      return sub;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '订阅计划失败';
      accountStore.setError(errorMessage);
      console.error('❌ [useAccountSubscription] 订阅计划失败:', err);
      return null;
    } finally {
      accountStore.setLoading(false);
    }
  }

  /**
   * 取消订阅
   */
  async function cancelSubscription(): Promise<SubscriptionDTO | null> {
    accountStore.setLoading(true);
    try {
      const sub = await cancelSubscriptionUseCase.execute();
      accountStore.setSubscription(sub);
      accountStore.setError(null);
      return sub;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '取消订阅失败';
      accountStore.setError(errorMessage);
      console.error('❌ [useAccountSubscription] 取消订阅失败:', err);
      return null;
    } finally {
      accountStore.setLoading(false);
    }
  }

  /**
   * 获取账户统计
   */
  async function loadAccountStats(): Promise<AccountStatsResponseDTO | null> {
    accountStore.setLoading(true);
    try {
      const stats = await getAccountStatsUseCase.execute();
      accountStore.setAccountStats(stats);
      accountStore.setError(null);
      return stats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取统计信息失败';
      accountStore.setError(errorMessage);
      console.error('❌ [useAccountSubscription] 获取统计信息失败:', err);
      return null;
    } finally {
      accountStore.setLoading(false);
    }
  }

  return {
    // State
    subscription,
    accountStats,
    isLoading,
    error,

    // Actions
    loadSubscription,
    subscribePlan,
    cancelSubscription,
    loadAccountStats,
  };
}
