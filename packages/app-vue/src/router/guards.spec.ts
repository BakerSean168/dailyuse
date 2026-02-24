import type {
  NavigationGuardNext,
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
} from 'vue-router';
import { describe, expect, it, vi } from 'vitest';
import { createAuthGuard } from './guards';

const createTo = (
  fullPath: string,
  requiresAuth: boolean,
): RouteLocationNormalized =>
  ({
    fullPath,
    matched: [{ meta: { requiresAuth } }],
  }) as unknown as RouteLocationNormalized;

describe('createAuthGuard', () => {
  it('allows route when authentication is not required', () => {
    const guard = createAuthGuard();
    const result = guard(
      createTo('/auth', false),
      {} as RouteLocationNormalizedLoaded,
      vi.fn() as NavigationGuardNext,
    );

    expect(result).toBe(true);
  });

  it('redirects to login route when auth is required and user is not authenticated', () => {
    const guard = createAuthGuard({ isAuthenticated: () => false, loginRoute: '/signin' });
    const result = guard(
      createTo('/dashboard', true),
      {} as RouteLocationNormalizedLoaded,
      vi.fn() as NavigationGuardNext,
    );

    expect(result).toEqual({ path: '/signin', query: { redirect: '/dashboard' } });
  });

  it('allows route when auth is required and user is authenticated', () => {
    const guard = createAuthGuard({ isAuthenticated: () => true });
    const result = guard(
      createTo('/dashboard', true),
      {} as RouteLocationNormalizedLoaded,
      vi.fn() as NavigationGuardNext,
    );

    expect(result).toBe(true);
  });
});
