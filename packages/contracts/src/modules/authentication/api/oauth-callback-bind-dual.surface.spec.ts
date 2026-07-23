import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

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
