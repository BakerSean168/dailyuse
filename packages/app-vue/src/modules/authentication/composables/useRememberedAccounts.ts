import { toast } from 'vue-sonner';
import type {
  RememberedDesktopAccountDTO,
  RememberedDesktopAccountLoginReq,
} from '@memoflow/contracts/authentication';
import type { AuthContext } from './useAuthContext';
import { completeAuthSuccess } from './completeAuthSuccess';
import {
  reportAuthCatchFailure,
  reportAuthResultFailure,
} from './reportAuthOperationFailure';

// Residual 923: isDesktopEnvironment name dual retired — use hasDesktopAuthApi detect.
// Residual 1045: completeAuthSuccess dual retired onto completeAuthSuccess sole.
// Residual 1049: auth result/catch failure duals retired onto reportAuthOperationFailure sole.
// Residual 1079 keep-boundary: removeRememberedAccount is toast-only (no store.setError;
// not reportAuthOperationFailure dual body — intentional soft-delete UX).

export function useRememberedAccounts(ctx: AuthContext) {
  const { store, service, t, lastResultError, redirectWithReload, handleAuthSuccess, getLocalizedAuthError } = ctx;
  const failureDeps = { store, t, lastResultError, getLocalizedAuthError };

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
      return reportAuthResultFailure(failureDeps, result.error, 'auth.toast.loginFailed');
    } catch (e) {
      return reportAuthCatchFailure(
        failureDeps,
        e,
        'loginRememberedDesktopAccount',
        'auth.toast.loginFailed',
      );
    } finally {
      store.setLoading(false);
    }
  }

  async function removeRememberedAccount(identityId: string): Promise<boolean> {
    // Residual 1079 keep-boundary: toast-only failure path (no store.setError dual).
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
