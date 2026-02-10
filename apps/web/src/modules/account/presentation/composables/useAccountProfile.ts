/**
 * Account Profile Composable
 * 账户资料组合式 API
 *
 * 职责:
 * - 调用 AccountProfileApplicationService 获取数据
 * - 管理 Pinia Store 中的状态更新
 * - 处理 Loading 和 Error 状态
 * - 为组件提供响应式的账户资料操作接口
 *
 * EPIC-018 重构:
 * - Service 只返回纯数据
 * - Composable 负责 Store 操作
 * - 组件使用 Composable，不直接调用 Service
 */

import { computed } from 'vue';
import { useAccountStore } from '../stores/accountStore';
import type {
  AccountDTO,
  UpdateAccountProfileRequestDTO,
  UpdateAccountPreferencesRequestDTO,
  UpdateEmailRequestDTO,
  VerifyEmailRequestDTO,
  UpdatePhoneRequestDTO,
  VerifyPhoneRequestDTO,
} from '@dailyuse/contracts/account';
import {
  GetMyProfile,
  UpdateMyProfile,
  ChangeMyPassword,
  GetAccountById,
  UpdateAccountProfile,
  UpdateAccountPreferences,
  UpdateEmail,
  VerifyEmail,
  UpdatePhone,
  VerifyPhone,
  DeactivateAccount,
  ActivateAccount,
  DeleteAccount,
  GetAccountHistory,
} from '@dailyuse/account/application-client';

export function useAccountProfile() {
  const accountStore = useAccountStore();

  // Use Cases from application-client
  const getMyProfileUseCase = GetMyProfile.getInstance();
  const updateMyProfileUseCase = UpdateMyProfile.getInstance();
  const changePasswordUseCase = ChangeMyPassword.getInstance();
  const getAccountByIdUseCase = GetAccountById.getInstance();
  const updateAccountProfileUseCase = UpdateAccountProfile.getInstance();
  const updatePreferencesUseCase = UpdateAccountPreferences.getInstance();
  const updateEmailUseCase = UpdateEmail.getInstance();
  const verifyEmailUseCase = VerifyEmail.getInstance();
  const updatePhoneUseCase = UpdatePhone.getInstance();
  const verifyPhoneUseCase = VerifyPhone.getInstance();
  const deactivateAccountUseCase = DeactivateAccount.getInstance();
  const activateAccountUseCase = ActivateAccount.getInstance();
  const deleteAccountUseCase = DeleteAccount.getInstance();
  const getAccountHistoryUseCase = GetAccountHistory.getInstance();

  // ============ State (from store) ============
  const currentAccount = computed(() => accountStore.currentAccount);
  const isLoading = computed(() => accountStore.isLoading);
  const error = computed(() => accountStore.error);

  // ============ Account Profile Methods ============

  /**
   * 获取当前用户资料
   */
  async function loadMyProfile(): Promise<AccountDTO | null> {
    accountStore.setLoading(true);
    try {
      const profile = await getMyProfileUseCase.execute();
      accountStore.setCurrentAccount(profile);
      accountStore.setError(null);
      return profile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取资料失败';
      accountStore.setError(errorMessage);
      console.error('❌ [useAccountProfile] 获取资料失败:', err);
      return null;
    } finally {
      accountStore.setLoading(false);
    }
  }

  /**
   * 更新当前用户资料
   */
  async function updateMyProfile(
    request: UpdateAccountProfileRequestDTO,
  ): Promise<AccountDTO | null> {
    accountStore.setLoading(true);
    try {
      const updated = await updateMyProfileUseCase.execute(request);
      accountStore.setCurrentAccount(updated);
      accountStore.setError(null);
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新资料失败';
      accountStore.setError(errorMessage);
      console.error('❌ [useAccountProfile] 更新资料失败:', err);
      return null;
    } finally {
      accountStore.setLoading(false);
    }
  }

  /**
   * 修改密码
   */
  async function changeMyPassword(
    oldPassword: string,
    newPassword: string,
  ): Promise<AccountDTO | null> {
    accountStore.setLoading(true);
    try {
      const result = await changePasswordUseCase.execute(oldPassword, newPassword);
      accountStore.setCurrentAccount(result);
      accountStore.setError(null);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '修改密码失败';
      accountStore.setError(errorMessage);
      console.error('❌ [useAccountProfile] 修改密码失败:', err);
      return null;
    } finally {
      accountStore.setLoading(false);
    }
  }

  /**
   * 通过 UUID 获取特定账户信息
   */
  async function getAccountById(accountUuid: string): Promise<AccountDTO | null> {
    accountStore.setLoading(true);
    try {
      const account = await getAccountByIdUseCase.execute(accountUuid);
      accountStore.setError(null);
      return account;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取账户信息失败';
      accountStore.setError(errorMessage);
      console.error('❌ [useAccountProfile] 获取账户信息失败:', err);
      return null;
    } finally {
      accountStore.setLoading(false);
    }
  }

  /**
   * 更新账户资料
   */
  async function updateProfile(
    request: UpdateAccountProfileRequestDTO,
  ): Promise<AccountDTO | null> {
    accountStore.setLoading(true);
    try {
      const updated = await updateAccountProfileUseCase.execute(request);
      accountStore.setCurrentAccount(updated);
      accountStore.setError(null);
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新账户失败';
      accountStore.setError(errorMessage);
      console.error('❌ [useAccountProfile] 更新账户失败:', err);
      return null;
    } finally {
      accountStore.setLoading(false);
    }
  }

  /**
   * 更新用户偏好设置
   */
  async function updatePreferences(
    request: UpdateAccountPreferencesRequestDTO,
  ): Promise<AccountDTO | null> {
    accountStore.setLoading(true);
    try {
      const updated = await updatePreferencesUseCase.execute(request);
      accountStore.setCurrentAccount(updated);
      accountStore.setError(null);
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新偏好设置失败';
      accountStore.setError(errorMessage);
      console.error('❌ [useAccountProfile] 更新偏好设置失败:', err);
      return null;
    } finally {
      accountStore.setLoading(false);
    }
  }

  /**
   * 更新电子邮件
   */
  async function updateEmail(request: UpdateEmailRequestDTO): Promise<AccountDTO | null> {
    accountStore.setLoading(true);
    try {
      const updated = await updateEmailUseCase.execute(request);
      accountStore.setCurrentAccount(updated);
      accountStore.setError(null);
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新电子邮件失败';
      accountStore.setError(errorMessage);
      console.error('❌ [useAccountProfile] 更新电子邮件失败:', err);
      return null;
    } finally {
      accountStore.setLoading(false);
    }
  }

  /**
   * 验证电子邮件
   */
  async function verifyEmail(request: VerifyEmailRequestDTO): Promise<AccountDTO | null> {
    accountStore.setLoading(true);
    try {
      const updated = await verifyEmailUseCase.execute(request);
      accountStore.setCurrentAccount(updated);
      accountStore.setError(null);
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '验证电子邮件失败';
      accountStore.setError(errorMessage);
      console.error('❌ [useAccountProfile] 验证电子邮件失败:', err);
      return null;
    } finally {
      accountStore.setLoading(false);
    }
  }

  /**
   * 更新电话号码
   */
  async function updatePhone(request: UpdatePhoneRequestDTO): Promise<AccountDTO | null> {
    accountStore.setLoading(true);
    try {
      const updated = await updatePhoneUseCase.execute(request);
      accountStore.setCurrentAccount(updated);
      accountStore.setError(null);
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新电话号码失败';
      accountStore.setError(errorMessage);
      console.error('❌ [useAccountProfile] 更新电话号码失败:', err);
      return null;
    } finally {
      accountStore.setLoading(false);
    }
  }

  /**
   * 验证电话号码
   */
  async function verifyPhone(request: VerifyPhoneRequestDTO): Promise<AccountDTO | null> {
    accountStore.setLoading(true);
    try {
      const updated = await verifyPhoneUseCase.execute(request);
      accountStore.setCurrentAccount(updated);
      accountStore.setError(null);
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '验证电话号码失败';
      accountStore.setError(errorMessage);
      console.error('❌ [useAccountProfile] 验证电话号码失败:', err);
      return null;
    } finally {
      accountStore.setLoading(false);
    }
  }

  /**
   * 停用账户
   */
  async function deactivateAccount(): Promise<AccountDTO | null> {
    accountStore.setLoading(true);
    try {
      const result = await deactivateAccountUseCase.execute();
      accountStore.setCurrentAccount(result);
      accountStore.setError(null);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '停用账户失败';
      accountStore.setError(errorMessage);
      console.error('❌ [useAccountProfile] 停用账户失败:', err);
      return null;
    } finally {
      accountStore.setLoading(false);
    }
  }

  /**
   * 激活账户
   */
  async function activateAccount(): Promise<AccountDTO | null> {
    accountStore.setLoading(true);
    try {
      const result = await activateAccountUseCase.execute();
      accountStore.setCurrentAccount(result);
      accountStore.setError(null);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '激活账户失败';
      accountStore.setError(errorMessage);
      console.error('❌ [useAccountProfile] 激活账户失败:', err);
      return null;
    } finally {
      accountStore.setLoading(false);
    }
  }

  /**
   * 删除账户
   */
  async function deleteAccount(): Promise<void> {
    accountStore.setLoading(true);
    try {
      await deleteAccountUseCase.execute();
      accountStore.clearCurrentAccount();
      accountStore.setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除账户失败';
      accountStore.setError(errorMessage);
      console.error('❌ [useAccountProfile] 删除账户失败:', err);
    } finally {
      accountStore.setLoading(false);
    }
  }

  /**
   * 获取账户历史记录
   */
  async function loadAccountHistory(): Promise<void> {
    accountStore.setLoading(true);
    try {
      const history = await getAccountHistoryUseCase.execute();
      accountStore.setAccountHistory(history);
      accountStore.setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取账户历史失败';
      accountStore.setError(errorMessage);
      console.error('❌ [useAccountProfile] 获取账户历史失败:', err);
    } finally {
      accountStore.setLoading(false);
    }
  }

  return {
    // State
    currentAccount,
    isLoading,
    error,

    // Actions
    loadMyProfile,
    updateMyProfile,
    changeMyPassword,
    getAccountById,
    updateProfile,
    updatePreferences,
    updateEmail,
    verifyEmail,
    updatePhone,
    verifyPhone,
    deactivateAccount,
    activateAccount,
    deleteAccount,
    loadAccountHistory,
  };
}
