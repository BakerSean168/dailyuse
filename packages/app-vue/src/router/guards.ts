import type { NavigationGuard, RouteLocationNormalized } from 'vue-router';
import { hasDesktopAuthApi } from '../shared/utils/desktop-auth-recovery';

// Residual 909: detect via hasDesktopAuthApi (no inline invoke dual).
// Residual 919: hasDesktopElectronBridge name dual retired — use hasDesktopAuthApi directly.
function shouldUseHardLoginRedirect(option?: boolean): boolean {
  if (typeof option === 'boolean') {
    return option;
  }
  // Web owns a separate AuthApp bootstrap for `/auth`. SPA navigation would load the
  // legacy in-shell AuthView fallback (including guest UI), so unauthenticated web
  // access must full-page navigate to the platform auth entry.
  return typeof window !== 'undefined' && !hasDesktopAuthApi(window);
}

function buildLoginRedirectUrl(loginRoute: string, redirectPath: string): string {
  const base =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'http://localhost';
  const url = new URL(loginRoute, base);
  url.searchParams.set('redirect', redirectPath);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function createAppAccessGuard(options?: {
  canAccessApp?: () => boolean;
  accessEntryRoute?: string;
  /**
   * When true, unauthenticated access performs a hard navigation to the login route
   * so the platform AuthApp owns `/auth` (Web). Desktop keeps SPA navigation.
   * Defaults to true on non-desktop browser environments.
   */
  useHardLoginRedirect?: boolean;
}): NavigationGuard {
  const { canAccessApp, accessEntryRoute = '/auth', useHardLoginRedirect } = options ?? {};

  return (to: RouteLocationNormalized) => {
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth !== false);
    if (!requiresAuth) return true;

    if (canAccessApp?.()) return true;

    if (shouldUseHardLoginRedirect(useHardLoginRedirect)) {
      if (typeof window !== 'undefined') {
        window.location.replace(buildLoginRedirectUrl(accessEntryRoute, to.fullPath));
      }
      return false;
    }

    return {
      path: accessEntryRoute,
      query: { redirect: to.fullPath },
    };
  };
}
