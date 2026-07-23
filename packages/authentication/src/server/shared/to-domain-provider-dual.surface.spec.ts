import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { toDomainProvider } from './to-domain-provider';
import { OAuthProvider } from '../domain';

/**
 * Residual 991: toDomainProvider dual retired (bind/unbind OAuth use cases).
 * Sole body in to-domain-provider.ts; bind + unbind use cases import it.
 * Soft residual 1022: tip focused suite numbers track Residual 1022 evidence tip (301/1307).
 * Soft residual 893: transport Microsoft keep-boundary → null (domain catalog has no Microsoft).
 * Does not flip §13.2 checkboxes.
 */
describe('toDomainProvider dual retired (residual 991)', () => {
  const dir = __dirname;
  const sole = readFileSync(resolve(dir, 'to-domain-provider.ts'), 'utf8');
  const bind = readFileSync(
    resolve(dir, '../application/use-cases/commands/bind-oauth.use-case.ts'),
    'utf8',
  );
  const unbind = readFileSync(
    resolve(dir, '../application/use-cases/commands/unbind-oauth.use-case.ts'),
    'utf8',
  );

  it('owns sole toDomainProvider helper body', () => {
    expect(sole).toContain('Residual 991');
    expect(sole).toMatch(/export function toDomainProvider\b/);
    expect(sole).toContain('Residual 893');
    expect(sole).toContain('OAuthProvider.Github');
    expect(sole).toContain('OAuthProvider.Google');
    expect(sole).toContain('OAuthProvider.Apple');
  });

  it('bind + unbind use cases import sole without local dual bodies', () => {
    for (const [label, source] of [
      ['bind', bind],
      ['unbind', unbind],
    ] as const) {
      expect(source, label).toContain('Residual 991');
      expect(source, label).toContain(
        "import { toDomainProvider } from '../../../shared/to-domain-provider'",
      );
      expect(source, label).not.toMatch(/function toDomainProvider\b/);
      expect(source, label).toContain('toDomainProvider(');
    }
  });

  it('maps transport providers onto domain catalog and rejects Microsoft', () => {
    expect(toDomainProvider('Github')).toBe(OAuthProvider.Github);
    expect(toDomainProvider('Google')).toBe(OAuthProvider.Google);
    expect(toDomainProvider('Apple')).toBe(OAuthProvider.Apple);
    expect(toDomainProvider('Microsoft')).toBeNull();
  });
});
