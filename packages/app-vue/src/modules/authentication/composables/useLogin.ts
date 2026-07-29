import type { LoginByEmailReq } from '@memoflow/contracts/authentication';
import type { AuthContext } from './useAuthContext';
import { completeAuthSuccess } from './completeAuthSuccess';
import {
  reportAuthCatchFailure,
  reportAuthResultFailure,
} from './reportAuthOperationFailure';

// Residual 923: isDesktopEnvironment name dual retired — use hasDesktopAuthApi detect.
// Residual 1045: completeAuthSuccess dual retired onto completeAuthSuccess sole.
// Residual 1049: auth result/catch failure duals retired onto reportAuthOperationFailure sole.

export function useLogin(ctx: AuthContext) {
  const { store, service, t, lastResultError, redirectWithReload, handleAuthSuccess, getLocalizedAuthError } = ctx;
  const failureDeps = { store, t, lastResultError, getLocalizedAuthError };

  async function loginByEmail(req: LoginByEmailReq): Promise<boolean> {
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.loginByEmail(req);
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
      return reportAuthCatchFailure(failureDeps, e, 'loginByEmail', 'auth.toast.loginFailed');
    } finally {
      store.setLoading(false);
    }
  }

  return {
    loginByEmail,
  };
}
