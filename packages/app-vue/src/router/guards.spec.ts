import { describe, expect, it } from 'vitest';
import { createAuthGuard } from './guards';

describe('createAuthGuard', () => {
  it('allows route when authentication is not required', () => {
    const guard = createAuthGuard();
    const result = guard(
      {
        fullPath: '/auth',
        matched: [{ meta: { requiresAuth: false } }],
      } as never,
      {} as never,
      (() => undefined) as never,
    );

    expect(result).toBe(true);
  });

  it('redirects to login route when auth is required and user is not authenticated', () => {
    const guard = createAuthGuard({ isAuthenticated: () => false, loginRoute: '/signin' });
    const result = guard(
      {
        fullPath: '/dashboard',
        matched: [{ meta: { requiresAuth: true } }],
      } as never,
      {} as never,
      (() => undefined) as never,
    );

    expect(result).toEqual({ path: '/signin', query: { redirect: '/dashboard' } });
  });
});
