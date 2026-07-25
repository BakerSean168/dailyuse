/**
 * usePassword - 密码管理 Composable
 *
 * 通过 DI 注入的 AuthClientService 与后端交互。
 * Service 返回 Result<T>，Composable 负责 Result 解包 + UI 状态。
 *
 * @module authentication/composables
 *
 * Soft residual 1055 / Residual 1075 keep-boundary: toast-only failure path
 * (no store.setError; not createComposableHandleError dual body).
 * Password flows report via toast only; intentional UX keep-boundary.
 */

import { ref } from 'vue';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';
import type {
  ChangePasswordReq,
  ForgotPasswordReq,
  ResetPasswordReq,
} from '@dailyuse/contracts/authentication';
import { useAuthenticationStore } from '../stores/authentication-store';
import { AUTH_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { translateResultError } from '../../../shared/utils/translate-result-error';

export function usePassword() {
  const store = useAuthenticationStore();
  const service = useStrictInject(AUTH_SERVICE_KEY, 'AuthService');
  const { t } = useI18n();

  const isLoading = ref(false);

  function getPasswordErrorMessage(error: unknown, fallbackKey: string) {
    return translateResultError(error, t, {
      scope: 'auth',
      fallbackKey,
    });
  }

  // ========== 修改密码 ==========

  async function changePassword(req: ChangePasswordReq): Promise<boolean> {
    if (!store.isAuthenticated) {
      toast.error(t('auth.toast.pleaseLogin'));
      return false;
    }

    isLoading.value = true;
    const result = await service.changePassword(req);
    isLoading.value = false;

    if (result.ok) {
      toast.success(t('auth.toast.passwordChanged'), {
        description: t('auth.toast.reloginWithNew'),
      });
      return true;
    }
    toast.error(t('auth.toast.operationFailed'), {
      description: getPasswordErrorMessage(result.error, 'auth.toast.changePasswordFailed'),
    });
    return false;
  }

  // ========== 忘记密码 ==========

  async function forgotPassword(req: ForgotPasswordReq): Promise<boolean> {
    isLoading.value = true;
    const result = await service.forgotPassword(req);
    isLoading.value = false;

    if (result.ok) {
      toast.success(t('auth.toast.resetEmailSent'), {
        description: t('auth.toast.checkResetEmail'),
      });
      return true;
    }
    toast.error(t('auth.toast.operationFailed'), {
      description: getPasswordErrorMessage(result.error, 'auth.toast.sendResetEmailFailed'),
    });
    return false;
  }

  // ========== 重置密码 ==========

  async function resetPassword(req: ResetPasswordReq): Promise<boolean> {
    isLoading.value = true;
    const result = await service.resetPassword(req);
    isLoading.value = false;

    if (result.ok) {
      toast.success(t('auth.toast.passwordReset'), { description: t('auth.toast.loginWithNew') });
      return true;
    }
    toast.error(t('auth.toast.operationFailed'), {
      description: getPasswordErrorMessage(result.error, 'auth.toast.resetPasswordFailed'),
    });
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
