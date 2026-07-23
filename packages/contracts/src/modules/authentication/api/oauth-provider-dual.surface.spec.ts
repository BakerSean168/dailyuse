import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 763: OAuth provider enum dual retired.
 * OAuthProviderSchema is the sole provider enum body reused by Get/Callback/Authorize/Unbind.
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
    const count = (oauth.match(/provider: OAuthProviderSchema/g) || []).length;
    expect(count).toBe(4);
  });

  it('availability DTO uses OAuthProvider type alias', () => {
    expect(oauth).toContain('provider: OAuthProvider');
    expect(oauth).not.toContain(
      "provider: 'Google' | 'Github' | 'Microsoft' | 'Apple'",
    );
  });
});
