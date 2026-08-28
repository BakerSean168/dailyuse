import * as argon2 from 'argon2';
import { verifyPassword as verifyBetterAuthPassword } from 'better-auth/crypto';

const ARGON2_HASH_PREFIX = '$argon2';

/**
 * Verify both the legacy MemoFlow Argon2 hashes and Better Auth's current
 * password format. Hash creation remains owned by Better Auth, so every new or
 * reset password naturally converges to the current Scrypt representation.
 */
export async function verifyCloudPassword(input: {
  readonly hash: string;
  readonly password: string;
}): Promise<boolean> {
  try {
    if (input.hash.startsWith(ARGON2_HASH_PREFIX)) {
      return await argon2.verify(input.hash, input.password);
    }
    return await verifyBetterAuthPassword(input);
  } catch {
    return false;
  }
}
