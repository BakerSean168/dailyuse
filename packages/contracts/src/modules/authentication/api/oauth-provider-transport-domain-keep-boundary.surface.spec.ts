import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 893: OAuthProvider transport schema ≠ domain/VO catalog keep-boundary.
 * OpenAPI/transport OAuthProviderSchema members differ from domain/VO OAuthProvider members.
 * Not an exact dual to collapse; keep separate bodies (no forced merge / type alias).
 * Residual 891 (soft): §13.2 open-items honest re-audit remains partial for OAuth E2E
 *   (packages/app-vue/src/views/section-13-2-dod-open-items.surface.spec.ts).
 * Residual 991 (soft): toDomainProvider dual retired — Microsoft→null lives in
 *   authentication/src/server/shared/to-domain-provider.ts (bind/unbind import sole).
 * Does not flip §13.2 checkboxes.
 */
describe('oauth provider transport≠domain keep-boundary (residual 893)', () => {
  const apiDir = __dirname;
  const voDir = resolve(apiDir, '../value-objects');
  const domainVo = resolve(
    apiDir,
    '../../../../../authentication/src/server/domain/value-objects/oauth-provider.ts',
  );
  const bindUseCase = resolve(
    apiDir,
    '../../../../../authentication/src/server/application/use-cases/commands/bind-oauth.use-case.ts',
  );
  const toDomainProvider = resolve(
    apiDir,
    '../../../../../authentication/src/server/shared/to-domain-provider.ts',
  );

  const oauthDto = readFileSync(resolve(apiDir, 'oauth.dto.ts'), 'utf8');
  const vo = readFileSync(resolve(voDir, 'oauth-provider.ts'), 'utf8');
  const domain = readFileSync(domainVo, 'utf8');
  const bind = readFileSync(bindUseCase, 'utf8');
  const mapper = readFileSync(toDomainProvider, 'utf8');

  it('keeps transport OAuthProviderSchema members (Microsoft; no Facebook/Wechat/Weibo)', () => {
    expect(oauthDto).toContain('Residual 893');
    expect(oauthDto).toContain(
      "export const OAuthProviderSchema = z.enum(['Google', 'Github', 'Microsoft', 'Apple'])",
    );
    expect(oauthDto).not.toContain('export type OAuthProvider =');
    // Transport catalog includes Microsoft; domain/VO catalog does not.
    expect(oauthDto).toContain("'Microsoft'");
    expect(oauthDto).not.toMatch(/z\.enum\(\[[^\]]*Facebook/);
    expect(oauthDto).not.toMatch(/z\.enum\(\[[^\]]*Wechat/);
    expect(oauthDto).not.toMatch(/z\.enum\(\[[^\]]*Weibo/);
    // Must not collapse transport type to domain VO const
    expect(oauthDto).not.toContain('export type OAuthProvider = typeof OAuthProvider');
    expect(oauthDto).not.toContain(
      "export type OAuthProvider = (typeof OAuthProvider)[keyof typeof OAuthProvider]",
    );
  });

  it('keeps domain/VO OAuthProvider catalog (Facebook/Wechat/Weibo; no Microsoft)', () => {
    expect(vo).toContain('Residual 893');
    expect(vo).toMatch(/export const OAuthProvider = \{/);
    expect(vo).toContain("Facebook: 'Facebook'");
    expect(vo).toContain("Wechat: 'Wechat'");
    expect(vo).toContain("Weibo: 'Weibo'");
    expect(vo).toContain("Github: 'Github'");
    expect(vo).toContain("Google: 'Google'");
    expect(vo).toContain("Apple: 'Apple'");
    // Domain/VO catalog does not list Microsoft
    expect(vo).not.toMatch(/Microsoft\s*:/);
    expect(vo).not.toContain(
      "export type OAuthProvider = z.infer<typeof OAuthProviderSchema>",
    );
    expect(vo).not.toMatch(/export const OAuthProviderSchema\b/);
    expect(vo).not.toMatch(/z\.enum\(/);
  });

  it('domain branded companion derives contracts VO; Microsoft stays unmapped at bind', () => {
    expect(domain).toContain('Residual 893');
    expect(domain).toContain(
      "import { OAuthProvider as IOAuthProvider } from '@dailyuse/contracts/authentication'",
    );
    expect(domain).toContain('Object.values(IOAuthProvider)');
    expect(domain).toContain('Facebook:');
    expect(domain).toContain('Wechat:');
    expect(domain).toContain('Weibo:');
    expect(domain).not.toMatch(/Microsoft\s*:/);
    // Residual 991: sole mapper owns Residual 893 Microsoft→null keep-boundary body
    expect(mapper).toContain('Residual 893');
    expect(mapper).toContain('Residual 991');
    expect(mapper).toContain("case 'Github':");
    expect(mapper).toContain("case 'Google':");
    expect(mapper).toContain("case 'Apple':");
    expect(mapper).not.toMatch(/case 'Microsoft'\s*:/);
    expect(mapper).toContain('return null;');
    expect(bind).toContain('Residual 991');
    expect(bind).toContain("import { toDomainProvider } from '../../../shared/to-domain-provider'");
    expect(bind).not.toMatch(/function toDomainProvider\b/);
  });
});
