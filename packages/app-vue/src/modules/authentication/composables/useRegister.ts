import { toast } from 'vue-sonner';
import type { RegisterByEmailReq } from '@dailyuse/contracts/authentication';
import type { AuthContext } from './useAuthContext';
import { isDesktopEnvironment } from './useAuthContext';

export function useRegister(ctx: AuthContext) {
  const { store, service, t, lastResultError, redirectWithReload, handleAuthSuccess, getLocalizedAuthError } = ctx;

  async function completeAuthSuccess(
    data: Parameters<typeof handleAuthSuccess>[0],
    title: string,
    description: string,
  ): Promise<boolean> {
    if (isDesktopEnvironment()) {
      store.reset();
    } else {
      handleAuthSuccess(data);
    }
    toast.success(title, { description });
    if (isDesktopEnvironment()) return true;
    redirectWithReload('/');
    return true;
  }

  async function registerByEmail(req: RegisterByEmailReq): Promise<boolean> {
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.registerByEmail(req);
      if (result.ok) {
        lastResultError.value = null;
        return await completeAuthSuccess(
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
