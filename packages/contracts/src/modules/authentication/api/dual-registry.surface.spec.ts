/**
 * Dual registry suite (elegance E3b tax cut).
 * Merged 5 dual-retired surface locks from this directory.
 * Behavior/assertions preserved; individual *-dual.surface.spec.ts removed.
 * Sources: auth-session-res-dual.surface.spec.ts, oauth-callback-bind-dual.surface.spec.ts, oauth-provider-dual.surface.spec.ts, oauth-response-dual.surface.spec.ts, session-res-dual.surface.spec.ts
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// --- merged from auth-session-res-dual.surface.spec.ts ---
{
  /**
   * Residual 713: auth session response dual bodies retired.
   * CurrentUserDTO / ListSessionsRes reuse *ResponseSchema only.
   */
  describe('auth session res dual retired (residual 713)', () => {
    const apiDir = __dirname;
    const dto = readFileSync(resolve(apiDir, 'session.dto.ts'), 'utf8');
    const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
    const routes = readFileSync(
      resolve(apiDir, '../../../../../authentication/src/api/routes.ts'),
      'utf8',
    );

    it('exports current-user and session-list response schemas', () => {
      expect(responseSchemas).toContain('Residual 713');
      expect(responseSchemas).toContain('export const CurrentUserResponseSchema');
      expect(responseSchemas).toContain('export const SessionListResponseSchema');
    });

    it('semantic types are z.infer aliases without interface dual bodies', () => {
      expect(dto).toContain('Residual 713');
      expect(dto).toContain(
        'export type CurrentUserDTO = z.infer<typeof CurrentUserResponseSchema>',
      );
      expect(dto).toContain('export type GetCurrentUserRes = CurrentUserDTO');
      expect(dto).toContain(
        'export type ListSessionsRes = z.infer<typeof SessionListResponseSchema>',
      );
      expect(dto).not.toMatch(/export interface CurrentUserDTO\b/);
      expect(dto).not.toMatch(/export interface ListSessionsRes\b/);
    });

    it('OpenAPI auth routes use CurrentUser/SessionList response schemas', () => {
      expect(routes).toContain('CurrentUserResponseSchema');
      expect(routes).toContain('SessionListResponseSchema');
      expect(routes).toContain('successResponse(CurrentUserResponseSchema');
      expect(routes).toContain('successResponse(SessionListResponseSchema');
    });
  });
}

// --- merged from oauth-callback-bind-dual.surface.spec.ts ---
{
  /**
   * Residual 759: OAuth callback/bind dual body retired.
   * BindOAuthSchema reuses OAuthCallbackSchema (shared authorize-callback payload).
   */
  describe('oauth callback/bind dual retired (residual 759)', () => {
    const apiDir = __dirname;
    const oauth = readFileSync(resolve(apiDir, 'oauth.dto.ts'), 'utf8');
    const routes = readFileSync(
      resolve(apiDir, '../../../../../authentication/src/api/routes.ts'),
      'utf8',
    );

    it('owns one callback payload schema body', () => {
      expect(oauth).toContain('Residual 759');
      expect(oauth).toContain('export const OAuthCallbackSchema = z.object({');
      expect(oauth).toContain("code: z.string().min(1)");
      expect(oauth).toContain("state: z.string().min(1)");
    });

    it('bind reuses OAuthCallbackSchema without dual body', () => {
      expect(oauth).toContain('export const BindOAuthSchema = OAuthCallbackSchema');
      expect(oauth).not.toMatch(
        /export const BindOAuthSchema\s*=\s*z\.object\(\{/,
      );
      expect(oauth).toContain(
        'export type BindOAuthReq = z.infer<typeof BindOAuthSchema>',
      );
      expect(oauth).toContain(
        'export type OAuthCallbackReq = z.infer<typeof OAuthCallbackSchema>',
      );
    });

    it('routes still reference both semantic schema names', () => {
      expect(routes).toContain('OAuthCallbackSchema');
      expect(routes).toContain('BindOAuthSchema');
    });
  });
}

// --- merged from oauth-provider-dual.surface.spec.ts ---
{
  /**
   * Residual 763: OAuth provider enum dual retired.
   * OAuthProviderSchema is the sole provider enum body reused by Get/Callback/Authorize/Unbind.
   * Residual 893 (soft): transport schema ≠ domain/VO catalog keep-boundary
   *   (oauth-provider-transport-domain-keep-boundary.surface.spec.ts).
   */
  describe('oauth provider dual retired (residual 763)', () => {
    const oauth = readFileSync(resolve(__dirname, 'oauth.dto.ts'), 'utf8');

    it('owns one OAuthProviderSchema body without a colliding transport alias', () => {
      expect(oauth).toContain('Residual 763');
      expect(oauth).toContain(
        "export const OAuthProviderSchema = z.enum(['Google', 'Github', 'Microsoft', 'Apple'])",
      );
      expect(oauth).not.toContain('export type OAuthProvider =');
    });

    it('request schemas reuse OAuthProviderSchema (no local enum duals)', () => {
      expect(oauth).toContain('provider: OAuthProviderSchema');
      expect(oauth).not.toMatch(
        /provider:\s*z\.enum\(\['Google', 'Github', 'Microsoft', 'Apple'\]\)/,
      );
      // Soft residual 763: request schemas (4) plus residual 765 res/availability schemas also reuse the provider enum.
      const count = (oauth.match(/provider: OAuthProviderSchema/g) || []).length;
      expect(count).toBeGreaterThanOrEqual(4);
    });

    it('availability DTO reuses OAuthProviderSchema', () => {
      expect(oauth).toContain('provider: OAuthProviderSchema');
      expect(oauth).not.toContain(
        "provider: 'Google' | 'Github' | 'Microsoft' | 'Apple'",
      );
    });
  });
}

// --- merged from oauth-response-dual.surface.spec.ts ---
{
  /**
   * Residual 765: OAuth response dual bodies retired.
   * GetOAuthUrlRes / BindOAuthRes / OAuthProvidersRes use *ResSchema only.
   */
  describe('oauth response duals retired (residual 765)', () => {
    const apiDir = __dirname;
    const oauth = readFileSync(resolve(apiDir, 'oauth.dto.ts'), 'utf8');
    const routes = readFileSync(
      resolve(apiDir, '../../../../../authentication/src/api/routes.ts'),
      'utf8',
    );

    it('dto owns Res schemas and z.infer aliases', () => {
      expect(oauth).toContain('Residual 765');
      expect(oauth).toContain('export const GetOAuthUrlResSchema = z.object({');
      expect(oauth).toContain('export const BindOAuthResSchema = z.object({');
      expect(oauth).toContain('export const OAuthProvidersResSchema = z.object({');
      expect(oauth).toContain(
        'export type GetOAuthUrlRes = z.infer<typeof GetOAuthUrlResSchema>',
      );
      expect(oauth).toContain(
        'export type BindOAuthRes = z.infer<typeof BindOAuthResSchema>',
      );
      expect(oauth).toContain(
        'export type OAuthProvidersRes = z.infer<typeof OAuthProvidersResSchema>',
      );
      expect(oauth).not.toMatch(/export interface GetOAuthUrlRes\b/);
      expect(oauth).not.toMatch(/export interface BindOAuthRes\b/);
      expect(oauth).not.toMatch(/export interface OAuthProvidersRes\b/);
    });

    it('OpenAPI routes use shared Res schemas without inline dual bodies', () => {
      expect(routes).toContain('GetOAuthUrlResSchema');
      expect(routes).toContain('BindOAuthResSchema');
      expect(routes).toContain('OAuthProvidersResSchema');
      expect(routes).toContain("successResponse(GetOAuthUrlResSchema, '授权 URL')");
      expect(routes).toContain("successResponse(BindOAuthResSchema, '绑定成功')");
      expect(routes).toContain("successResponse(OAuthProvidersResSchema, '提供者列表')");
      expect(routes).not.toMatch(
        /successResponse\(\s*z\.object\(\{\s*authUrl:/,
      );
      expect(routes).not.toMatch(
        /provider:\s*z\.enum\(\['Google', 'Github', 'Microsoft', 'Apple'\]\)/,
      );
    });

    it('provider list availability reuses OAuthProviderSchema', () => {
      expect(oauth).toContain(
        'export const OAuthProviderAvailabilitySchema = z.object({',
      );
      expect(oauth).toContain('provider: OAuthProviderSchema');
    });
  });
}

// --- merged from session-res-dual.surface.spec.ts ---
{
  /**
   * Residual 769: session ValidateTokenRes / GuestModeRes dual bodies retired.
   * Res types are z.infer aliases of sole *ResSchema shapes.
   */
  describe('session res duals retired (residual 769)', () => {
    const session = readFileSync(resolve(__dirname, 'session.dto.ts'), 'utf8');

    it('owns ValidateTokenResSchema and z.infer alias', () => {
      expect(session).toContain('Residual 769');
      expect(session).toContain(
        'export const ValidateTokenResSchema = z.object({',
      );
      expect(session).toContain(
        'export type ValidateTokenRes = z.infer<typeof ValidateTokenResSchema>',
      );
      expect(session).not.toMatch(/export interface ValidateTokenRes\b/);
    });

    it('owns GuestModeResSchema and z.infer alias', () => {
      expect(session).toContain(
        'export const GuestModeResSchema = z.object({',
      );
      expect(session).toContain(
        'export type GuestModeRes = z.infer<typeof GuestModeResSchema>',
      );
      expect(session).not.toMatch(/export interface GuestModeRes\b/);
    });

    it('keeps residual 713 current-user / session-list single-track aliases', () => {
      expect(session).toContain('Residual 713');
      expect(session).toContain(
        'export type CurrentUserDTO = z.infer<typeof CurrentUserResponseSchema>',
      );
      expect(session).toContain(
        'export type ListSessionsRes = z.infer<typeof SessionListResponseSchema>',
      );
    });
  });
}
