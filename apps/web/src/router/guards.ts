/**
 * Auth Navigation Guard
 *
 * 检查路由的 requiresAuth meta 标记，
 * 未登录用户重定向到 /auth。
 */

import type { NavigationGuardWithThis, RouteLocationNormalized } from 'vue-router';
import { useAuthenticationStore } from '@/modules/authentication/presentation/stores/authenticationStore';

export const authGuard: NavigationGuardWithThis<undefined> = (
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  if (!requiresAuth) return true;

  const authStore = useAuthenticationStore();

  if (authStore.isAuthenticated) return true;

  // 保存目标路径，登录后可以重定向回来
  return {
    path: '/auth',
    query: { redirect: to.fullPath },
  };
};
