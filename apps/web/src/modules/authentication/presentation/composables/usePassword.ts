/**
 * usePassword - 密码管理 Composable
 *
 * 通过 DI 注入的 AuthClientService 与后端交互。
 * Service 负责 API 调用，Composable 负责 UI 状态。
 *
 * @module authentication/presentation/composables
 */

import { ref, inject } from 'vue';
import { toast } from 'vue-sonner';
import type {
  ChangePasswordReq,
  ForgotPasswordReq,
  ResetPasswordReq,
} from '@dailyuse/contracts/authentication';
import { HttpClientError } from '@dailyuse/http-client';
import { useAuthenticationStore } from '../stores/authenticationStore';
import { AUTH_SERVICE_KEY, authService as fallbackService } from '@/shared/di';

export function usePassword() {
  const store = useAuthenticationStore();
  const service = inject(AUTH_SERVICE_KEY, fallbackService);
  const isLoading = ref(false);

  // ========== 修改密码 ==========

  async function changePassword(req: ChangePasswordReq): Promise<boolean> {
    if (!store.accessToken) {
      toast.error('请先登录');
      return false;
    }

    isLoading.value = true;
    try {
      await service.changePassword(req);
      toast.success('密码已修改', { description: '请使用新密码重新登录' });
      return true;
    } catch (err) {
      const message = err instanceof HttpClientError ? err.message : '修改密码失败';
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
      await service.forgotPassword(req);
      toast.success('重置邮件已发送', { description: '请查收邮件并点击重置链接' });
      return true;
    } catch (err) {
      const message = err instanceof HttpClientError ? err.message : '发送重置邮件失败';
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
      await service.resetPassword(req);
      toast.success('密码已重置', { description: '请使用新密码登录' });
      return true;
    } catch (err) {
      const message = err instanceof HttpClientError ? err.message : '重置密码失败';
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
