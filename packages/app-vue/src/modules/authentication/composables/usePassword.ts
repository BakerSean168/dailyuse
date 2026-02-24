/**
 * usePassword - 密码管理 Composable
 *
 * 通过 DI 注入的 AuthClientService 与后端交互。
 * Service 返回 Result<T>，Composable 负责 Result 解包 + UI 状态。
 *
 * @module authentication/composables
 */

import { ref, inject } from 'vue';
import { toast } from 'vue-sonner';
import type {
  ChangePasswordReq,
  ForgotPasswordReq,
  ResetPasswordReq,
} from '@dailyuse/contracts/authentication';
import { useAuthenticationStore } from '../stores/authenticationStore';
import { AUTH_SERVICE_KEY } from '../../../di/keys';

export function usePassword() {
  const store = useAuthenticationStore();
  const service = inject(AUTH_SERVICE_KEY);
  if (!service) throw new Error('AUTH_SERVICE_KEY not provided');

  const isLoading = ref(false);

  // ========== 修改密码 ==========

  async function changePassword(req: ChangePasswordReq): Promise<boolean> {
    if (!store.accessToken) {
      toast.error('请先登录');
      return false;
    }

    isLoading.value = true;
    const result = await service.changePassword(req);
    isLoading.value = false;

    if (result.ok) {
      toast.success('密码已修改', { description: '请使用新密码重新登录' });
      return true;
    }
    toast.error('操作失败', { description: result.error.message || '修改密码失败' });
    return false;
  }

  // ========== 忘记密码 ==========

  async function forgotPassword(req: ForgotPasswordReq): Promise<boolean> {
    isLoading.value = true;
    const result = await service.forgotPassword(req);
    isLoading.value = false;

    if (result.ok) {
      toast.success('重置邮件已发送', { description: '请查收邮件并点击重置链接' });
      return true;
    }
    toast.error('操作失败', { description: result.error.message || '发送重置邮件失败' });
    return false;
  }

  // ========== 重置密码 ==========

  async function resetPassword(req: ResetPasswordReq): Promise<boolean> {
    isLoading.value = true;
    const result = await service.resetPassword(req);
    isLoading.value = false;

    if (result.ok) {
      toast.success('密码已重置', { description: '请使用新密码登录' });
      return true;
    }
    toast.error('操作失败', { description: result.error.message || '重置密码失败' });
    return false;
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
