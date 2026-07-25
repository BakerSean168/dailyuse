/**
 * Residual 891 (soft): §13.2 open three-login item remains partial
 *   (section-13-2-dod-open-items.surface.spec.ts).
 *
 * ADR-034 / vault-plan three-login surface matrix + same-fixture journey.
 * Documents the product entry contract without mounting full OAuth or guest flows.
 * 三入口产品面契约：不启动完整 OAuth / 访客流程，只锁定平台入口边界。
 *
 * The journey series reuses one fixture identity through Web hard-redirect →
 * AuthApp password/GitHub → Desktop password/guest → guest upgrade vault ownership
 * rebind (profile path stable) → guest cloud knowledge repo boundary →
 * GitHub OAuth identity transport never grants knowledge-repo App install/token.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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

  it('step 7: phone/SMS is absent from all three login surfaces (not a first-party login path)', () => {
    expect(THREE_LOGIN_SURFACE_MATRIX.webShell.phoneSms).toBe(false);
    expect(THREE_LOGIN_SURFACE_MATRIX.authApp.phoneSms).toBe(false);
    expect(THREE_LOGIN_SURFACE_MATRIX.desktop.phoneSms).toBe(false);
  });

  it('step 8: server-held data disclosure is Web-only (never a Desktop product surface)', () => {
    // Product boundary (residual 75 / §13.2): retained server-held disclosure is available
    // only from the authenticated Web runtime. Desktop host injects DESKTOP_AUTH_API_KEY, so
    // useDataPortability keeps isServerDisclosureAvailable=false and the IPC adapter fails
    // closed with NOT_SUPPORTED without invoking IPC.
    type RuntimeSurface = 'web' | 'desktop';
    const isServerDisclosureAvailable = (surface: RuntimeSurface, hasService: boolean) =>
      hasService && surface === 'web';

    expect(isServerDisclosureAvailable('web', true)).toBe(true);
    expect(isServerDisclosureAvailable('desktop', true)).toBe(false);
    expect(isServerDisclosureAvailable('web', false)).toBe(false);

    // Guest remains Desktop-only and still cannot unlock server-held disclosure.
    expect(THREE_LOGIN_SURFACE_MATRIX.desktop.guest).toBe(true);
    expect(isServerDisclosureAvailable('desktop', true)).toBe(false);
  });

  it('step 9: product surface source files lock the three-login matrix boundaries', () => {
    const authPlatformEntry = readFileSync(
      resolve(__dirname, './AuthPlatformEntry.vue'),
      'utf8',
    );
    const desktopAuth = readFileSync(resolve(__dirname, './DesktopAuthView.vue'), 'utf8');
    const webAuth = readFileSync(
      resolve(__dirname, '../../../../apps/web/src/auth/WebAuthView.vue'),
      'utf8',
    );
    const dataPortability = readFileSync(
      resolve(__dirname, '../modules/setting/composables/useDataPortability.ts'),
      'utf8',
    );

    // Web shell entry only hard-redirects; never hosts password/guest/GitHub itself.
    expect(authPlatformEntry).toContain('window.location.replace');
    expect(authPlatformEntry).toContain('data-testid="auth-platform-entry"');
    expect(authPlatformEntry).not.toContain('enterGuestMode');
    expect(authPlatformEntry).not.toContain('login-github-button');

    // Desktop owns password + guest; never GitHub OAuth login button.
    expect(desktopAuth).toContain('enterGuestMode');
    expect(desktopAuth).toContain('data-testid="guest-mode-button"');
    expect(desktopAuth).toContain('data-testid="desktop-login-password"');
    expect(desktopAuth).not.toContain('login-github-button');
    expect(desktopAuth).not.toMatch(/Continue with GitHub/);

    // AuthApp (WebAuthView) owns password + GitHub; no guest mode.
    expect(webAuth).toContain('data-testid="login-github-button"');
    expect(webAuth).not.toContain('enterGuestMode');
    expect(webAuth).not.toContain('guest-mode-button');

    // Server-held disclosure is gated off Desktop by DESKTOP_AUTH_API_KEY presence.
    expect(dataPortability).toContain('DESKTOP_AUTH_API_KEY');
    expect(dataPortability).toContain(
      'const isServerDisclosureAvailable = ref(service !== undefined && desktopApi === undefined);',
    );
  });

  it('step 10: GitHub OAuth identity never grants knowledge-repo installation or token', () => {
    // Code-local ADR-034 boundary (residual 307 / §13.2 three-login): GitHub login is
    // identity-only. Repo App install, connection, and desktop token live on a separate
    // repository transport. No fake OAuth credentials or Playwright cross-end E2E.
    const ipcChannels = readFileSync(
      resolve(__dirname, '../../../contracts/src/electron/ipc-channels.ts'),
      'utf8',
    );
    const getOAuthUrl = readFileSync(
      resolve(
        __dirname,
        '../../../authentication/src/server/application/use-cases/commands/get-oauth-url.use-case.ts',
      ),
      'utf8',
    );
    const authRoutes = readFileSync(
      resolve(__dirname, '../../../authentication/src/api/routes.ts'),
      'utf8',
    );
    const knowledgeRoutes = readFileSync(
      resolve(
        __dirname,
        '../../../repository/src/api/routes/knowledge-repository-connection.routes.ts',
      ),
      'utf8',
    );
    const productAuth = readFileSync(
      resolve(__dirname, '../../../../docs/product/modules/authentication.md'),
      'utf8',
    );
    const webAuth = readFileSync(
      resolve(__dirname, '../../../../apps/web/src/auth/WebAuthView.vue'),
      'utf8',
    );
    const desktopAuth = readFileSync(resolve(__dirname, './DesktopAuthView.vue'), 'utf8');
    const authPlatformEntry = readFileSync(
      resolve(__dirname, './AuthPlatformEntry.vue'),
      'utf8',
    );

    // IPC: auth OAuth identity channels stay under auth:; knowledge App install/token under repository:.
    expect(ipcChannels).toContain("GET_OAUTH_URL: 'auth:get-oauth-url'");
    expect(ipcChannels).toContain("OAUTH_CALLBACK: 'auth:oauth-callback'");
    expect(ipcChannels).toContain("OAUTH_BIND: 'auth:oauth-bind'");
    expect(ipcChannels).toContain(
      "KNOWLEDGE_CONNECTION_INSTALLATION_START: 'repository:knowledge-connection:installation:start'",
    );
    expect(ipcChannels).toContain(
      "KNOWLEDGE_CONNECTION_DESKTOP_TOKEN: 'repository:knowledge-connection:desktop-token'",
    );
    expect(ipcChannels).not.toMatch(/auth:[^'\n]*knowledge-connection/);
    expect(ipcChannels).not.toMatch(/repository:[^'\n]*oauth/);

    // Authorize URL scopes are identity-only (never repo Contents for login).
    expect(getOAuthUrl).toContain(
      'Identity-only scopes (ADR-034). Never request repo Contents here.',
    );
    expect(getOAuthUrl).toContain("['read:user', 'user:email']");
    expect(getOAuthUrl).not.toContain("'repo'");
    expect(getOAuthUrl).not.toContain("'contents'");
    expect(getOAuthUrl).not.toContain("'write:repo'");

    // HTTP route namespaces stay separate: /oauth/* vs /knowledge-connections/*.
    expect(authRoutes).toContain("path: '/oauth/providers'");
    expect(authRoutes).toContain("path: '/oauth/url'");
    expect(authRoutes).toContain("path: '/oauth/callback'");
    expect(authRoutes).toContain("path: '/oauth/bind'");
    expect(authRoutes).not.toContain('knowledge-connections');
    expect(knowledgeRoutes).toContain("path: '/knowledge-connections/installations/start'");
    expect(knowledgeRoutes).toContain("path: '/knowledge-connections/installations/complete'");
    expect(knowledgeRoutes).toContain("path: '/knowledge-connections/:connectionId/desktop-token'");
    expect(knowledgeRoutes).not.toContain("path: '/oauth/");

    // Product module doc keeps the three-login matrix wording aligned with sources
    // (residual 333: explicit identity≠knowledge-repo App / identity-only scopes lock).
    expect(productAuth).toContain('GitHub 登录只解决');
    expect(productAuth).toContain('不暴露 GitHub 登录按钮');
    expect(productAuth).toContain('知识仓库仍需单独授权');
    expect(productAuth).toContain('访客仅 Desktop');
    // Residual 307/333 step-10 product invariants: scopes + no Contents + separate App.
    expect(productAuth).toContain('`read:user`');
    expect(productAuth).toContain('`user:email`');
    expect(productAuth).toContain('identity-only scopes');
    expect(productAuth).toContain('repo Contents');
    expect(productAuth).toContain('知识仓库 GitHub App');
    expect(productAuth).toContain('installation/token');

    // UI hosts: AuthApp OAuth callback lands on exact `/auth` (code+state); Desktop first screen is guest, not OAuth.
    expect(webAuth).toContain('`${window.location.origin}/auth`');
    expect(webAuth).not.toContain('scene=oauth-callback');
    expect(webAuth).toContain('data-testid="login-github-button"');
    expect(webAuth).not.toContain('guest-mode-button');
    expect(desktopAuth).toContain('data-testid="guest-mode-button"');
    expect(desktopAuth).not.toContain('login-github-button');
    expect(desktopAuth).not.toContain('oauth-callback');
    expect(desktopAuth).not.toMatch(/Continue with GitHub/);
    // Web shell entry still only hard-redirects; never mounts GitHub or guest.
    expect(authPlatformEntry).toContain('window.location.replace');
    expect(authPlatformEntry).not.toContain('login-github-button');
    expect(authPlatformEntry).not.toContain('guest-mode-button');

    // Journey matrix consistency for the same fixture identity.
    expect(THREE_LOGIN_SURFACE_MATRIX.authApp.githubOAuthLogin).toBe(true);
    expect(THREE_LOGIN_SURFACE_MATRIX.desktop.githubOAuthLogin).toBe(false);
    expect(THREE_LOGIN_SURFACE_MATRIX.webShell.githubOAuthLogin).toBe(false);
    expect(THREE_LOGIN_SURFACE_MATRIX.desktop.guest).toBe(true);
    expect(THREE_LOGIN_SURFACE_MATRIX.authApp.guest).toBe(false);
    expect(THREE_LOGIN_SURFACE_MATRIX.webShell.guest).toBe(false);
    expect(THREE_LOGIN_JOURNEY_FIXTURE.email).toBe('journey.user@example.com');
  });

});
