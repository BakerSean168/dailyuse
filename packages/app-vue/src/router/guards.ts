import type { NavigationGuard, RouteLocationNormalized } from 'vue-router';

export function createAuthGuard(options?: {
  isAuthenticated?: () => boolean;
  loginRoute?: string;
}): NavigationGuard {
  const { isAuthenticated, loginRoute = '/auth' } = options ?? {};

  return (to: RouteLocationNormalized) => {
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth !== false);
    if (!requiresAuth) return true;

    if (isAuthenticated?.()) return true;

    return {
      path: loginRoute,
      query: { redirect: to.fullPath },
    };
  };
}
