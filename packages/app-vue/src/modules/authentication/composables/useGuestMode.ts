import { toast } from 'vue-sonner';
import type { AutoLoginResult } from '@dailyuse/contracts/authentication';
import type { AuthContext } from './useAuthContext';
import { isDesktopEnvironment } from './useAuthContext';
import { hydrateDesktopBootstrapAuthState } from '../../../shared/utils/desktop-bootstrap-auth';

export function useGuestMode(ctx: AuthContext) {
  const { store, service, t, lastResultError, getLocalizedAuthError } = ctx;

  async function refreshToken(): Promise<boolean> {
    if (!store.isAuthenticated) return false;

    if (isDesktopEnvironment()) {
      const hydrated = await hydrateDesktopBootstrapAuthState((window as any).electronAPI);
      return hydrated;
    }

    const currentRefreshToken = store.refreshToken;
    if (!currentRefreshToken) return false;

    const result = await service.refreshToken({ refreshToken: currentRefreshToken });
    if (result.ok) {
      store.handleAuthResponse(result.data);
      store.setError(null);
      return true;
    }
    console.error('Token refresh failed:', result.error.message);
    store.reset();
    return false;
  }

  async function logout(): Promise<void> {
    try {
      if (store.isAuthenticated) {
        const result = await service.logout();
        if (!result.ok) {
          console.warn('Logout API call failed:', result.error.message);
        }
      }
    } finally {
      store.reset();
      toast.success(t('auth.toast.loggedOut'));
      if (!isDesktopEnvironment()) {
        if (typeof window !== 'undefined') {
          window.location.replace('/auth');
        }
      }
    }
  }

  async function enterGuestMode(): Promise<boolean> {
    if (!isDesktopEnvironment()) {
      toast.error(t('auth.toast.guestModeFailed'), {
        description: t('auth.validation.guestModeUnavailable'),
      });
      return false;
    }

    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.enterGuestMode();
      if (result.ok) {
        lastResultError.value = null;
        store.reset();
        toast.success(t('auth.toast.guestModeEntered'), {
          description: t('auth.toast.guestModeLocalOnly'),
        });
        return true;
      }
      lastResultError.value = result.error;
      const message = getLocalizedAuthError(result.error, 'auth.errors.UNKNOWN');
      store.setError(message);
      toast.error(t('auth.toast.guestModeFailed'), { description: message });
      return false;
    } catch (e) {
      console.error('[auth] enterGuestMode failed', e);
      lastResultError.value = {
        code: 'UNKNOWN',
        message: e instanceof Error ? e.message : 'Unknown error',
      };
      const message = getLocalizedAuthError(e, 'auth.errors.UNKNOWN');
      store.setError(message);
      toast.error(t('auth.toast.guestModeFailed'), { description: message });
      return false;
    } finally {
      store.setLoading(false);
    }
  }

  async function autoLoginDesktop(): Promise<AutoLoginResult> {
    if (!isDesktopEnvironment()) {
      return { ok: false, authenticated: false, error: 'Desktop only' };
    }

    store.setLoading(true);
    store.setError(null);
    lastResultError.value = null;

    try {
      const result = await service.autoLoginDesktop();
      if (!result.ok) {
        lastResultError.value = result.error;
        const message = getLocalizedAuthError(result.error, 'auth.errors.UNKNOWN');
        store.setError(message);
        return { ok: false, authenticated: false, error: message };
      }

      if (result.data.authenticated) {
        store.reset();
      }

      return result.data;
    } catch (e) {
      console.error('[auth] autoLoginDesktop failed', e);
      const message = getLocalizedAuthError(e, 'auth.errors.UNKNOWN');
      lastResultError.value = {
        code: 'UNKNOWN',
        message: e instanceof Error ? e.message : 'Unknown error',
      };
      store.setError(message);
      return { ok: false, authenticated: false, error: message };
    } finally {
      store.setLoading(false);
    }
  }

  return {
    refreshToken,
    logout,
    enterGuestMode,
    autoLoginDesktop,
  };
}
