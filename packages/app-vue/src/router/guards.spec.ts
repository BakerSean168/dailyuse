import type {
  NavigationGuardNext,
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
} from 'vue-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('allows route when authentication is not required', () => {
    const guard = createAuthGuard({ useHardLoginRedirect: false });
    const result = guard(
      createTo('/auth', false),
      {} as RouteLocationNormalizedLoaded,
      vi.fn() as NavigationGuardNext,
    );

    expect(result).toBe(true);
  });

  it('redirects to login route with SPA navigation when hard redirect is disabled', () => {
    const guard = createAuthGuard({
      isAuthenticated: () => false,
      loginRoute: '/signin',
      useHardLoginRedirect: false,
    });
    const result = guard(
      createTo('/dashboard', true),
      {} as RouteLocationNormalizedLoaded,
      vi.fn() as NavigationGuardNext,
    );

    expect(result).toEqual({ path: '/signin', query: { redirect: '/dashboard' } });
  });

  it('hard-redirects web auth entry so the platform AuthApp owns /auth', () => {
    const replace = vi.fn();
    vi.stubGlobal('location', {
      ...window.location,
      origin: 'https://app.example',
      replace,
    });

    const guard = createAuthGuard({
      isAuthenticated: () => false,
      loginRoute: '/auth',
      useHardLoginRedirect: true,
    });
    const result = guard(
      createTo('/repository', true),
      {} as RouteLocationNormalizedLoaded,
      vi.fn() as NavigationGuardNext,
    );

    expect(result).toBe(false);
    expect(replace).toHaveBeenCalledWith('/auth?redirect=%2Frepository');
  });

  it('allows route when auth is required and user is authenticated', () => {
    const guard = createAuthGuard({ isAuthenticated: () => true, useHardLoginRedirect: false });
    const result = guard(
      createTo('/dashboard', true),
      {} as RouteLocationNormalizedLoaded,
      vi.fn() as NavigationGuardNext,
    );

    expect(result).toBe(true);
  });
});
