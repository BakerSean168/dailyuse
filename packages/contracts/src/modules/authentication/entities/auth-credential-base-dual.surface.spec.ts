import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 687: base auth credential server dual collapsed.
 * PasswordCredentialServerDTO owns the full server credential shape.
 */
describe('auth credential base server dual retired (residual 687)', () => {
  const entities = __dirname;

  it('drops base dual file and does not export a base server dual', () => {
    const index = readFileSync(resolve(entities, 'index.ts'), 'utf8');
    const password = readFileSync(resolve(entities, 'password-credential-server.ts'), 'utf8');

    expect(existsSync(resolve(entities, 'base-auth-credential-server.ts'))).toBe(false);
    expect(index).toContain('Residual 687');
    expect(index).not.toMatch(/from '\.\/base-auth-credential-server'/);
    expect(index).not.toMatch(/export type \{[^}]*BaseAuthCredentialServerDTO/);

    expect(password).toContain('Residual 687');
    expect(password).toContain('export interface PasswordCredentialServerDTO');
    expect(password).not.toMatch(/extends\s+\w*BaseAuthCredential/);
    expect(password).not.toMatch(/from '\.\/base-auth-credential-server'/);
    expect(password).toContain("type: 'Password'");
    expect(password).toContain('hashedPassword: HashedPassword');
    expect(password).toContain('status: CredentialStatus');
  });
});
