import { toast } from 'vue-sonner';
import type { AutoLoginResult } from '@dailyuse/contracts/authentication';
import { resetEmailVerificationCircuit } from '@dailyuse/http-client';
import type { AuthContext } from './useAuthContext';
import {
  getDesktopAuthApi,
  hasDesktopAuthApi,
} from '../../../shared/utils/desktop-auth-recovery';
import { hydrateDesktopBootstrapAuthState } from '../../../shared/utils/desktop-bootstrap-auth';
import {
  reportAuthCatchFailure,
  reportAuthResultFailure,
} from './reportAuthOperationFailure';

// Residual 913: host access via getDesktopAuthApi (no inline host cast dual).
// Residual 923: isDesktopEnvironment name dual retired — use hasDesktopAuthApi detect.
// Residual 1051: enterGuestMode result/catch failure duals retired onto reportAuthOperationFailure sole.
// Residual 1077 keep-boundary: autoLoginDesktop returns AutoLoginResult shape
// (setError + structured return; not toast dual / not reportAuthOperationFailure sole).
export function useGuestMode(ctx: AuthContext) {
  const { store, service, t, lastResultError, getLocalizedAuthError } = ctx;
  const failureDeps = { store, t, lastResultError, getLocalizedAuthError };

  async function refreshToken(): Promise<boolean> {
    if (!store.isAuthenticated) return false;

    if (typeof window !== 'undefined' && hasDesktopAuthApi(window)) {
      const hydrated = await hydrateDesktopBootstrapAuthState(getDesktopAuthApi(window));
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
      // Clear session-scoped EMAIL_VERIFICATION_REQUIRED fuse so a later
      // verified login can load knowledge notes without a full page reload.
      resetEmailVerificationCircuit();
      store.reset();
      toast.success(t('auth.toast.loggedOut'));
      if (!(typeof window !== 'undefined' && hasDesktopAuthApi(window))) {
        if (typeof window !== 'undefined') {
          window.location.replace('/auth');
        }
      }
    }
  }

  async function enterGuestMode(): Promise<boolean> {
    if (!(typeof window !== 'undefined' && hasDesktopAuthApi(window))) {
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
      return reportAuthResultFailure(failureDeps, result.error, 'auth.toast.guestModeFailed');
    } catch (e) {
      return reportAuthCatchFailure(failureDeps, e, 'enterGuestMode', 'auth.toast.guestModeFailed');
    } finally {
      store.setLoading(false);
    }
  }

  // Residual 1077 keep-boundary: AutoLoginResult return path (no toast dual body).
  async function autoLoginDesktop(): Promise<AutoLoginResult> {
    if (!(typeof window !== 'undefined' && hasDesktopAuthApi(window))) {
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
