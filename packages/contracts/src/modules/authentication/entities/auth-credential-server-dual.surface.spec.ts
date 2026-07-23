import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 685: AuthCredential server dual retired.
 * AuthIdentity credentials + mappers use PasswordCredentialServerDTO only.
 */
describe('auth credential server dual retired (residual 685)', () => {
  const entities = __dirname;
  const aggregates = resolve(entities, '../aggregates');
  const monorepoRoot = resolve(entities, '../../../../../../');

  it('drops dual file and barrel export', () => {
    const index = readFileSync(resolve(entities, 'index.ts'), 'utf8');
    expect(existsSync(resolve(entities, 'auth-credential-server.ts'))).toBe(false);
    expect(index).toContain('Residual 685');
    expect(index).not.toMatch(/export type \{[^}]*AuthCredentialServerDTO/);
    expect(index).not.toMatch(/from '\.\/auth-credential-server'/);
    expect(index).toContain('PasswordCredentialServerDTO');
  });

  it('identity aggregate + auth mappers use PasswordCredentialServerDTO only', () => {
    const identity = readFileSync(resolve(aggregates, 'auth-identity-server.ts'), 'utf8');
    expect(identity).toContain('Residual 685');
    expect(identity).toContain('credentials: PasswordCredentialServerDTO[]');
    expect(identity).not.toMatch(/AuthCredentialServerDTO\b/);

    const credentialMapper = readFileSync(
      resolve(
        monorepoRoot,
        'packages/authentication/src/server/infrastructure/adapters/prisma/mappers/prisma-auth-credential-mapper.ts',
      ),
      'utf8',
    );
    const identityMapper = readFileSync(
      resolve(
        monorepoRoot,
        'packages/authentication/src/server/infrastructure/adapters/prisma/mappers/prisma-auth-identity-mapper.ts',
      ),
      'utf8',
    );
    const powersyncMapper = readFileSync(
      resolve(
        monorepoRoot,
        'packages/authentication/src/server/infrastructure/adapters/powersync/mappers/powersync-auth-identity.mapper.ts',
      ),
      'utf8',
    );

    for (const src of [credentialMapper, identityMapper, powersyncMapper]) {
      expect(src).toContain('PasswordCredentialServerDTO');
      expect(src).not.toMatch(/\bAuthCredentialServerDTO\b/);
    }
  });
});
