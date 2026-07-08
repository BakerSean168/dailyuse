/**
 * Argon2 Password Hasher
 *
 * Implements IPasswordHasher using argon2 algorithm.
 */

import * as argon2 from 'argon2';
import type { IPasswordHasher } from '../../domain';

/**
 * Argon2-based password hasher
 */
export class Argon2Hasher implements IPasswordHasher {
  async hash(plain: string): Promise<string> {
    return argon2.hash(plain);
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, plain);
  }
}
