import type { RegisterByEmailReq } from '@memoflow/contracts/authentication';
import type { AuthContext } from './useAuthContext';
import { completeAuthSuccess } from './completeAuthSuccess';
import {
  reportAuthCatchFailure,
  reportAuthResultFailure,
} from './reportAuthOperationFailure';

// Residual 923: isDesktopEnvironment name dual retired — use hasDesktopAuthApi detect.
// Residual 1045: completeAuthSuccess dual retired onto completeAuthSuccess sole.
// Residual 1049: auth result/catch failure duals retired onto reportAuthOperationFailure sole.

export function useRegister(ctx: AuthContext) {
  const { store, service, t, lastResultError, redirectWithReload, handleAuthSuccess, getLocalizedAuthError } = ctx;
  const failureDeps = { store, t, lastResultError, getLocalizedAuthError };

  async function registerByEmail(req: RegisterByEmailReq): Promise<boolean> {
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.registerByEmail(req);
      if (result.ok) {
        lastResultError.value = null;
        return await completeAuthSuccess(
          {
            resetStore: () => store.reset(),
            handleAuthSuccess,
            redirectWithReload,
          },
          result.data,
          t('auth.toast.registerSuccess'),
          t('auth.toast.welcomeJoin'),
        );
      }
      return reportAuthResultFailure(failureDeps, result.error, 'auth.toast.registerFailed');
    } catch (e) {
      return reportAuthCatchFailure(failureDeps, e, 'registerByEmail', 'auth.toast.registerFailed');
    } finally {
      store.setLoading(false);
    }
  }

  return {
    registerByEmail,
  };
}
