export interface IPasswordHasher {
  /** Hashes a plaintext password. */
  hash(plain: string): Promise<string>;

  /** Compares a plaintext password against a hash. */
  compare(plain: string, hashed: string): Promise<boolean>;
}
