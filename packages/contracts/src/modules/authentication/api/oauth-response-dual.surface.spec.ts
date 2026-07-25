import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

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
