import * as argon2 from 'argon2';
import { hashPassword } from 'better-auth/crypto';
import { describe, expect, it } from 'vitest';
import { verifyCloudPassword } from './password-compatibility.js';

describe('verifyCloudPassword', () => {
  it('keeps a migrated legacy Argon2 password usable without re-hashing it', async () => {
    const hash = await argon2.hash('legacy-password');

    await expect(verifyCloudPassword({ hash, password: 'legacy-password' })).resolves.toBe(true);
    await expect(verifyCloudPassword({ hash, password: 'wrong-password' })).resolves.toBe(false);
  });

  it('continues to verify Better Auth current Scrypt hashes', async () => {
    const hash = await hashPassword('current-password');

    await expect(verifyCloudPassword({ hash, password: 'current-password' })).resolves.toBe(true);
    await expect(verifyCloudPassword({ hash, password: 'wrong-password' })).resolves.toBe(false);
  });

  it('fails closed for a malformed hash', async () => {
    await expect(verifyCloudPassword({ hash: 'not-a-password-hash', password: 'x' })).resolves.toBe(
      false,
    );
  });
});
