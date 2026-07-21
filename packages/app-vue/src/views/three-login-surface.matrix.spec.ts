/**
 * ADR-034 / vault-plan three-login surface matrix.
 * Documents the product entry contract without mounting full OAuth or guest flows.
 * 三入口产品面契约：不启动完整 OAuth / 访客流程，只锁定平台入口边界。
 */
import { describe, expect, it } from 'vitest';

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
