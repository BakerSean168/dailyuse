/**
 * usePassword - 密码管理 Composable
 *
 * 处理修改密码、忘记密码、重置密码等操作。
 * 通过 authApi 服务直接调用 API。
 *
 * @module authentication/presentation/composables
 */

import { ref } from 'vue';
import { toast } from 'vue-sonner';
import type {
  ChangePasswordReq,
  ForgotPasswordReq,
  ResetPasswordReq,
} from '@dailyuse/contracts/authentication';
import { useAuthenticationStore } from '../stores/authenticationStore';
import { authApi, AuthApiError } from '../services/authApi';

export function usePassword() {
  const store = useAuthenticationStore();
  const isLoading = ref(false);

  // ========== 修改密码 ==========

  async function changePassword(req: ChangePasswordReq): Promise<boolean> {
    if (!store.accessToken) {
      toast.error('请先登录');
      return false;
    }

    isLoading.value = true;
    try {
      await authApi.changePassword(req, store.accessToken);
      toast.success('密码已修改', { description: '请使用新密码重新登录' });
      return true;
    } catch (err) {
      const message = err instanceof AuthApiError ? err.message : '修改密码失败';
      toast.error('操作失败', { description: message });
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // ========== 忘记密码 ==========

  async function forgotPassword(req: ForgotPasswordReq): Promise<boolean> {
    isLoading.value = true;
    try {
      await authApi.forgotPassword(req);
      toast.success('重置邮件已发送', { description: '请查收邮件并点击重置链接' });
      return true;
    } catch (err) {
      const message = err instanceof AuthApiError ? err.message : '发送重置邮件失败';
      toast.error('操作失败', { description: message });
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // ========== 重置密码 ==========

  async function resetPassword(req: ResetPasswordReq): Promise<boolean> {
    isLoading.value = true;
    try {
      await authApi.resetPassword(req);
      toast.success('密码已重置', { description: '请使用新密码登录' });
      return true;
    } catch (err) {
      const message = err instanceof AuthApiError ? err.message : '重置密码失败';
      toast.error('操作失败', { description: message });
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    // State
    isLoading,

    // Actions
    changePassword,
    forgotPassword,
    resetPassword,
  };
}
