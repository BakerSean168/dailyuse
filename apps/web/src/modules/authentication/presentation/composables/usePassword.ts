/**
 * Password Composable
 * 密码和 MFA 管理组合式 API
 *
 * 职责:
 * - 调用 PasswordApplicationService 获取数据
 * - 管理密码、MFA 和安全相关状态
 * - 处理两步验证设置
 */

import { computed } from 'vue';
import { useAuthenticationStore } from '../stores/authenticationStore';
import type {
  ForgotPasswordRequestDTO,
  ResetPasswordRequestDTO,
  ChangePasswordRequestDTO,
  Enable2FARequestDTO,
  Disable2FARequestDTO,
  Verify2FARequestDTO,
  Enable2FAResponseDTO,
} from '@dailyuse/contracts/account';
import {
  ForgotPassword,
  ResetPassword,
  ChangePassword,
  Enable2FA,
  Disable2FA,
  Verify2FA,
} from '@dailyuse/authentication/application-client';

export function usePassword() {
  const authStore = useAuthenticationStore();
  const forgotPasswordUseCase = ForgotPassword.getInstance();
  const resetPasswordUseCase = ResetPassword.getInstance();
  const changePasswordUseCase = ChangePassword.getInstance();
  const enable2FAUseCase = Enable2FA.getInstance();
  const disable2FAUseCase = Disable2FA.getInstance();
  const verify2FAUseCase = Verify2FA.getInstance();

  // ============ State (from store) ============
  const isLoading = computed(() => authStore.isLoading);
  const error = computed(() => authStore.error);
  const mfaDevices = computed(() => authStore.mfaDevices);
  const hasMFAEnabled = computed(() => authStore.hasMFAEnabled);

  // ============ Password Methods ============

  /**
   * 忘记密码
   */
  async function forgotPassword(request: ForgotPasswordRequestDTO): Promise<boolean> {
    authStore.setLoading(true);
    try {
      await forgotPasswordUseCase.execute(request);
      authStore.setError(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '发送重置链接失败';
      authStore.setError(errorMessage);
      console.error('❌ [usePassword] 发送重置链接失败:', err);
      return false;
    } finally {
      authStore.setLoading(false);
    }
  }

  /**
   * 重置密码
   */
  async function resetPassword(request: ResetPasswordRequestDTO): Promise<boolean> {
    authStore.setLoading(true);
    try {
      await resetPasswordUseCase.execute(request);
      authStore.setError(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '重置密码失败';
      authStore.setError(errorMessage);
      console.error('❌ [usePassword] 重置密码失败:', err);
      return false;
    } finally {
      authStore.setLoading(false);
    }
  }

  /**
   * 修改密码
   */
  async function changePassword(request: ChangePasswordRequestDTO): Promise<boolean> {
    authStore.setLoading(true);
    try {
      await changePasswordUseCase.execute(request);
      authStore.setError(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '修改密码失败';
      authStore.setError(errorMessage);
      console.error('❌ [usePassword] 修改密码失败:', err);
      return false;
    } finally {
      authStore.setLoading(false);
    }
  }

  /**
   * 启用双因素认证
   */
  async function enable2FA(request: Enable2FARequestDTO): Promise<Enable2FAResponseDTO | null> {
    authStore.setLoading(true);
    try {
      const response = await enable2FAUseCase.execute(request);
      authStore.setError(null);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '启用双因素认证失败';
      authStore.setError(errorMessage);
      console.error('❌ [usePassword] 启用双因素认证失败:', err);
      return null;
    } finally {
      authStore.setLoading(false);
    }
  }

  /**
   * 禁用双因素认证
   */
  async function disable2FA(request: Disable2FARequestDTO): Promise<boolean> {
    authStore.setLoading(true);
    try {
      await disable2FAUseCase.execute(request);
      authStore.clearMFADevices();
      authStore.setError(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '禁用双因素认证失败';
      authStore.setError(errorMessage);
      console.error('❌ [usePassword] 禁用双因素认证失败:', err);
      return false;
    } finally {
      authStore.setLoading(false);
    }
  }

  /**
   * 验证双因素认证
   */
  async function verify2FA(request: Verify2FARequestDTO): Promise<boolean> {
    authStore.setLoading(true);
    try {
      await verify2FAUseCase.execute(request);
      authStore.setRequiresMFA(false);
      authStore.setError(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '验证双因素认证失败';
      authStore.setError(errorMessage);
      console.error('❌ [usePassword] 验证双因素认证失败:', err);
      return false;
    } finally {
      authStore.setLoading(false);
    }
  }

  return {
    // State
    isLoading,
    error,
    mfaDevices,
    hasMFAEnabled,

    // Actions
    forgotPassword,
    resetPassword,
    changePassword,
    enable2FA,
    disable2FA,
    verify2FA,
  };
}
