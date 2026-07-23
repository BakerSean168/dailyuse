import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { normalizeEmail } from './normalize-email';

/**
 * Residual 959: normalizeEmail dual retired.
 * Sole body in normalize-email.ts; send-email-verification-code + verify-email-code import it.
 * Soft residual 949: maskEmail dual retired (mask-email-dual.surface.spec.ts).
 * Soft residual 957: vault FS guards dual retired
 *   (packages/repository/src/electron/vault-fs-guards-dual.surface.spec.ts).
 * Soft residual 968: tip focused suite numbers track Residual 968 evidence tip (275/1213).
 * Soft residual 961: toChallengePurpose dual retired (to-challenge-purpose-dual.surface.spec.ts).
 * Does not flip §13.2 checkboxes.
 */
describe('normalizeEmail dual retired (residual 959)', () => {
  const sharedDir = __dirname;
  const sole = readFileSync(resolve(sharedDir, 'normalize-email.ts'), 'utf8');
  const send = readFileSync(
    resolve(sharedDir, '../application/use-cases/commands/send-email-verification-code.use-case.ts'),
    'utf8',
  );
  const verify = readFileSync(
    resolve(sharedDir, '../application/use-cases/commands/verify-email-code.use-case.ts'),
    'utf8',
  );

  it('owns sole normalizeEmail helper body', () => {
    expect(sole).toContain('Residual 959');
    expect(sole).toMatch(/export function normalizeEmail\b/);
    expect(sole).toContain('return email.trim()');
    expect(sole).toContain('Keep original casing');
  });

  it('send and verify use cases import sole without local dual bodies', () => {
    expect(send).toContain('Residual 959');
    expect(send).toContain(
      "import { normalizeEmail } from '../../../shared/normalize-email'",
    );
    expect(send).not.toMatch(/function normalizeEmail\b/);
    expect(send).toContain('normalizeEmail(input.email)');
    expect(send).toContain('normalizeEmail(primary.value)');

    expect(verify).toContain('Residual 959');
    expect(verify).toContain(
      "import { normalizeEmail } from '../../../shared/normalize-email'",
    );
    expect(verify).not.toMatch(/function normalizeEmail\b/);
    expect(verify).toContain('normalizeEmail(input.email)');
  });

  it('trims without lowercasing', () => {
    expect(normalizeEmail('  Alice@Example.COM  ')).toBe('Alice@Example.COM');
    expect(normalizeEmail('\tbob@test.com\n')).toBe('bob@test.com');
    expect(normalizeEmail('')).toBe('');
  });
});
