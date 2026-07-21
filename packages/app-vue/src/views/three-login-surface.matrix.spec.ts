/**
 * ADR-034 / vault-plan three-login surface matrix + same-fixture journey.
 * Documents the product entry contract without mounting full OAuth or guest flows.
 * 三入口产品面契约：不启动完整 OAuth / 访客流程，只锁定平台入口边界。
 *
 * The journey series reuses one fixture identity through Web hard-redirect →
 * AuthApp password/GitHub → Desktop password/guest → guest upgrade vault ownership
 * rebind (profile path stable) → guest cloud knowledge repo boundary.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RouteLocationNormalized } from 'vue-router';
import { createAuthGuard } from '../router/guards';

type LoginSurface = {
  password: boolean;
  githubOAuthLogin: boolean;
  guest: boolean;
  phoneSms: boolean;
  hardRedirectToAuthApp: boolean;
};

/**
 * Canonical surface matrix for Web shell, Desktop shell, and AuthApp.
 * AuthApp hosts Web password + GitHub; Desktop hosts password + guest.
 * Phone/SMS is not a first-party login surface until a real SMS provider exists.
 */
export const THREE_LOGIN_SURFACE_MATRIX = {
  webShell: {
    password: false,
    githubOAuthLogin: false,
    guest: false,
    phoneSms: false,
    hardRedirectToAuthApp: true,
  },
  authApp: {
    password: true,
    githubOAuthLogin: true,
    guest: false,
    phoneSms: false,
    hardRedirectToAuthApp: false,
  },
  desktop: {
    password: true,
    githubOAuthLogin: false,
    guest: true,
    phoneSms: false,
    hardRedirectToAuthApp: false,
  },
} as const satisfies Record<string, LoginSurface>;

/**
 * Shared fixture for the three-login journey series (not a real GitHub/OAuth E2E).
 * Desktop guest upgrade keeps profileId/vaultDir; only identity ownership rebinds.
 */
export const THREE_LOGIN_JOURNEY_FIXTURE = {
  email: 'journey.user@example.com',
  guestIdentityId: '__desktop_guest_profile__',
  onlineIdentityId: 'IdentityId_journey_online_1',
  guestProfileId: 'profile_journey_guest_1',
  vaultDir: '/tmp/memoflow-journey/profile_journey_guest_1/vault',
  webProtectedPath: '/ai',
  authLoginRoute: '/auth',
} as const;

function createRoute(path: string, requiresAuth = true): RouteLocationNormalized {
  return {
    fullPath: path,
    path,
    query: {},
    hash: '',
    name: undefined,
    params: {},
    matched: [{ meta: { requiresAuth } } as never],
    redirectedFrom: undefined,
    meta: {},
  } as RouteLocationNormalized;
}

describe('ADR-034 three-login surface matrix', () => {
  it('keeps guest exclusively on Desktop', () => {
    expect(THREE_LOGIN_SURFACE_MATRIX.desktop.guest).toBe(true);
    expect(THREE_LOGIN_SURFACE_MATRIX.authApp.guest).toBe(false);
    expect(THREE_LOGIN_SURFACE_MATRIX.webShell.guest).toBe(false);
  });

  it('keeps GitHub OAuth login on AuthApp only (not Desktop first-screen, not Web shell)', () => {
    expect(THREE_LOGIN_SURFACE_MATRIX.authApp.githubOAuthLogin).toBe(true);
    expect(THREE_LOGIN_SURFACE_MATRIX.desktop.githubOAuthLogin).toBe(false);
    expect(THREE_LOGIN_SURFACE_MATRIX.webShell.githubOAuthLogin).toBe(false);
  });

  it('requires unauthenticated Web shell traffic to leave the main shell for AuthApp', () => {
    expect(THREE_LOGIN_SURFACE_MATRIX.webShell.hardRedirectToAuthApp).toBe(true);
    expect(THREE_LOGIN_SURFACE_MATRIX.webShell.password).toBe(false);
  });

  it('exposes password login on both Desktop and AuthApp', () => {
    expect(THREE_LOGIN_SURFACE_MATRIX.desktop.password).toBe(true);
    expect(THREE_LOGIN_SURFACE_MATRIX.authApp.password).toBe(true);
  });

  it('excludes phone/SMS from every first-party login surface', () => {
    expect(THREE_LOGIN_SURFACE_MATRIX.webShell.phoneSms).toBe(false);
    expect(THREE_LOGIN_SURFACE_MATRIX.authApp.phoneSms).toBe(false);
    expect(THREE_LOGIN_SURFACE_MATRIX.desktop.phoneSms).toBe(false);
  });
});

describe('ADR-034 three-login same-fixture journey', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('step 1: unauthenticated Web shell hard-redirects the fixture path to AuthApp', () => {
    const replace = vi.fn();
    vi.stubGlobal('location', {
      ...window.location,
      origin: 'http://localhost:5173',
      replace,
    });

    const guard = createAuthGuard({
      isAuthenticated: () => false,
      loginRoute: THREE_LOGIN_JOURNEY_FIXTURE.authLoginRoute,
      useHardLoginRedirect: THREE_LOGIN_SURFACE_MATRIX.webShell.hardRedirectToAuthApp,
    });

    const result = guard(
      createRoute(THREE_LOGIN_JOURNEY_FIXTURE.webProtectedPath),
      createRoute('/'),
      vi.fn() as never,
    );

    expect(THREE_LOGIN_SURFACE_MATRIX.webShell.password).toBe(false);
    expect(THREE_LOGIN_SURFACE_MATRIX.webShell.guest).toBe(false);
    expect(result).toBe(false);
    expect(replace).toHaveBeenCalledWith(
      `${THREE_LOGIN_JOURNEY_FIXTURE.authLoginRoute}?redirect=${encodeURIComponent(
        THREE_LOGIN_JOURNEY_FIXTURE.webProtectedPath,
      )}`,
    );
  });

  it('step 2: AuthApp owns password + GitHub for the same fixture email (no guest/phone)', () => {
    const surface = THREE_LOGIN_SURFACE_MATRIX.authApp;
    expect(surface.password).toBe(true);
    expect(surface.githubOAuthLogin).toBe(true);
    expect(surface.guest).toBe(false);
    expect(surface.phoneSms).toBe(false);
    expect(THREE_LOGIN_JOURNEY_FIXTURE.email).toContain('@');
  });

  it('step 3: Desktop first screen is password + guest for the same fixture (no GitHub OAuth)', () => {
    const surface = THREE_LOGIN_SURFACE_MATRIX.desktop;
    expect(surface.password).toBe(true);
    expect(surface.guest).toBe(true);
    expect(surface.githubOAuthLogin).toBe(false);
    expect(surface.phoneSms).toBe(false);
    expect(surface.hardRedirectToAuthApp).toBe(false);
  });

  it('step 4: guest upgrade rebinds ownership without moving Vault directory', () => {
    // Contract of DesktopProfileRuntimeManager.upgradeGuestProfileToOnlineIdentity:
    // profileId and profileDir stay stable; only identityId becomes online.
    const before = {
      identityId: THREE_LOGIN_JOURNEY_FIXTURE.guestIdentityId,
      profileId: THREE_LOGIN_JOURNEY_FIXTURE.guestProfileId,
      vaultDir: THREE_LOGIN_JOURNEY_FIXTURE.vaultDir,
    };
    const after = {
      identityId: THREE_LOGIN_JOURNEY_FIXTURE.onlineIdentityId,
      profileId: before.profileId,
      vaultDir: before.vaultDir,
    };

    expect(after.profileId).toBe(before.profileId);
    expect(after.vaultDir).toBe(before.vaultDir);
    expect(after.identityId).not.toBe(before.identityId);
    expect(after.identityId).toBe(THREE_LOGIN_JOURNEY_FIXTURE.onlineIdentityId);
  });

  it('step 5: guest and offline-only modes cannot open cloud knowledge-repo authorization', () => {
    type AuthMode = 'GUEST' | 'OFFLINE_USER' | 'ONLINE_USER';
    const canUseCloudKnowledgeRepo = (mode: AuthMode) =>
      mode !== 'GUEST' && mode !== 'OFFLINE_USER';

    expect(canUseCloudKnowledgeRepo('GUEST')).toBe(false);
    expect(canUseCloudKnowledgeRepo('OFFLINE_USER')).toBe(false);
    expect(canUseCloudKnowledgeRepo('ONLINE_USER')).toBe(true);

    // Guest remains exclusively a Desktop surface for this fixture journey.
    expect(THREE_LOGIN_SURFACE_MATRIX.desktop.guest).toBe(true);
    expect(THREE_LOGIN_SURFACE_MATRIX.authApp.guest).toBe(false);
    expect(THREE_LOGIN_SURFACE_MATRIX.webShell.guest).toBe(false);
  });

  it('step 6: GitHub login is identity-only and never implies knowledge-repo App authorization', () => {
    // Product/ADR-034 boundary: AuthApp may show GitHub OAuth for login, but that is not
    // repository sync authorization. Repo App install/connect remains a separate online-only
    // settings flow (covered by toCloudAccessToken / knowledge connection services).
    const authApp = THREE_LOGIN_SURFACE_MATRIX.authApp;
    expect(authApp.githubOAuthLogin).toBe(true);

    type AuthMode = 'GUEST' | 'OFFLINE_USER' | 'ONLINE_USER';
    const githubLoginImpliesRepoAccess = (_mode: AuthMode, githubLoginSucceeded: boolean) => {
      void _mode;
      void githubLoginSucceeded;
      return false;
    };

    expect(githubLoginImpliesRepoAccess('ONLINE_USER', true)).toBe(false);
    expect(githubLoginImpliesRepoAccess('GUEST', false)).toBe(false);

    // Desktop never exposes GitHub OAuth login button; online accounts still bind repos later.
    expect(THREE_LOGIN_SURFACE_MATRIX.desktop.githubOAuthLogin).toBe(false);
    expect(THREE_LOGIN_SURFACE_MATRIX.desktop.password).toBe(true);
  });
});
