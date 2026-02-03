import * as argon2 from 'argon2';
import { IPasswordHasher } from '@dailyuse/domain-shared/authentication';

export class Argon2Hasher implements IPasswordHasher {
  async hash(plain: string): Promise<string> {
    return argon2.hash(plain);
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, plain);
  }
}