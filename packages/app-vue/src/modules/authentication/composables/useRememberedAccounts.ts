import { toast } from 'vue-sonner';
import type {
  RememberedDesktopAccountDTO,
  RememberedDesktopAccountLoginReq,
} from '@dailyuse/contracts/authentication';
import type { AuthContext } from './useAuthContext';
import { completeAuthSuccess } from './completeAuthSuccess';

// Residual 923: isDesktopEnvironment name dual retired — use hasDesktopAuthApi detect.
// Residual 1045: completeAuthSuccess dual retired onto completeAuthSuccess sole.

export function useRememberedAccounts(ctx: AuthContext) {
  const { store, service, t, lastResultError, redirectWithReload, handleAuthSuccess, getLocalizedAuthError } = ctx;

  async function listRememberedAccounts(): Promise<RememberedDesktopAccountDTO[]> {
    const result = await service.listRememberedAccounts();
    if (result.ok) {
      lastResultError.value = null;
      return result.data;
    }
    lastResultError.value = result.error;
    return [];
  }

  async function loginRememberedDesktopAccount(
    req: RememberedDesktopAccountLoginReq,
  ): Promise<boolean> {
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.loginRememberedDesktopAccount(req);
      if (result.ok) {
        lastResultError.value = null;
        return await completeAuthSuccess(
          {
            resetStore: () => store.reset(),
            handleAuthSuccess,
            redirectWithReload,
          },
          result.data,
          t('auth.toast.loginSuccess'),
          t('auth.toast.welcomeBack'),
        );
      }
      lastResultError.value = result.error;
      const message = getLocalizedAuthError(result.error, 'auth.errors.UNKNOWN');
      store.setError(message);
      toast.error(t('auth.toast.loginFailed'), { description: message });
      return false;
    } catch (e) {
      store.setLoading(false);
      console.error('[auth] loginRememberedDesktopAccount failed', e);
      lastResultError.value = {
        code: 'UNKNOWN',
        message: e instanceof Error ? e.message : 'Unknown error',
      };
      const description = getLocalizedAuthError(e, 'auth.errors.UNKNOWN');
      store.setError(description);
      toast.error(t('auth.toast.loginFailed'), { description });
      return false;
    } finally {
      store.setLoading(false);
    }
  }

  async function removeRememberedAccount(identityId: string): Promise<boolean> {
    const result = await service.removeRememberedAccount(identityId);
    if (result.ok) {
      lastResultError.value = null;
      return true;
    }

    lastResultError.value = result.error;
    toast.error(t('auth.toast.removeRememberedAccountFailed'), {
      description: getLocalizedAuthError(result.error, 'auth.errors.UNKNOWN'),
    });
    return false;
  }

  return {
    listRememberedAccounts,
    loginRememberedDesktopAccount,
    removeRememberedAccount,
  };
}
