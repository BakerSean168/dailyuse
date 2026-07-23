import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 763: OAuth provider enum dual retired.
 * OAuthProviderSchema is the sole provider enum body reused by Get/Callback/Authorize/Unbind.
 * Residual 893 (soft): transport schema ≠ domain/VO catalog keep-boundary
 *   (oauth-provider-transport-domain-keep-boundary.surface.spec.ts).
 */
describe('oauth provider dual retired (residual 763)', () => {
  const oauth = readFileSync(resolve(__dirname, 'oauth.dto.ts'), 'utf8');

  it('owns one OAuthProviderSchema body', () => {
    expect(oauth).toContain('Residual 763');
    expect(oauth).toContain(
      "export const OAuthProviderSchema = z.enum(['Google', 'Github', 'Microsoft', 'Apple'])",
    );
    expect(oauth).toContain(
      'export type OAuthProvider = z.infer<typeof OAuthProviderSchema>',
    );
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

  it('availability DTO uses OAuthProvider type alias', () => {
    expect(oauth).toContain('provider: OAuthProvider');
    expect(oauth).not.toContain(
      "provider: 'Google' | 'Github' | 'Microsoft' | 'Apple'",
    );
  });
});
