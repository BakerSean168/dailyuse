import { toast } from 'vue-sonner';
import type { RegisterByEmailReq } from '@dailyuse/contracts/authentication';
import type { AuthContext } from './useAuthContext';
import { completeAuthSuccess } from './complete-auth-success';

// Residual 923: isDesktopEnvironment name dual retired — use hasDesktopAuthApi detect.
// Residual 1045: completeAuthSuccess dual retired onto complete-auth-success sole.

export function useRegister(ctx: AuthContext) {
  const { store, service, t, lastResultError, redirectWithReload, handleAuthSuccess, getLocalizedAuthError } = ctx;

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
      lastResultError.value = result.error;
      const message = getLocalizedAuthError(result.error, 'auth.errors.UNKNOWN');
      store.setError(message);
      toast.error(t('auth.toast.registerFailed'), { description: message });
      return false;
    } catch (e) {
      store.setLoading(false);
      console.error('[auth] registerByEmail failed', e);
      lastResultError.value = {
        code: 'UNKNOWN',
        message: e instanceof Error ? e.message : 'Unknown error',
      };
      const description = getLocalizedAuthError(e, 'auth.errors.UNKNOWN');
      store.setError(description);
      toast.error(t('auth.toast.registerFailed'), { description });
      return false;
    } finally {
      store.setLoading(false);
    }
  }

  return {
    registerByEmail,
  };
}
