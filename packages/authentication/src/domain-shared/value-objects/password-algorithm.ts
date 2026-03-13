import type { PasswordAlgorithm as IPasswordAlgorithm } from '@dailyuse/contracts/authentication';

/**
 * Password algorithm - identifier for password hashing and verification algorithms.
 *
 * Branded type: string at runtime, with compile-time type safety.
 */
export type PasswordAlgorithm = IPasswordAlgorithm & { readonly __brand: unique symbol };

/**
 * Valid values set - Single Source of Truth.
 * Note: Bcrypt and Argon2 are industry-recommended modern password hashing algorithms.
 */
const VALUES: IPasswordAlgorithm[] = ['Bcrypt', 'Argon2', 'Scrypt'];

/**
 * Companion object providing static methods and behavior logic.
 */
export const PasswordAlgorithm = {
  // ================= Constants =================

  Bcrypt: 'Bcrypt' as PasswordAlgorithm,
  Argon2: 'Argon2' as PasswordAlgorithm,
  Scrypt: 'Scrypt' as PasswordAlgorithm,

  // ================= Factory Methods =================

  /**
   * Factory method: validates and converts a string to PasswordAlgorithm.
   */
  of(value: string): PasswordAlgorithm {
    if (!this.isValid(value)) {
      throw new Error(`Invalid password algorithm: ${value}`);
    }
    return value as PasswordAlgorithm;
  },

  // ================= Type Guards =================

  /**
   * Type guard: runtime type check for PasswordAlgorithm values.
   */
  isValid(value: string): value is PasswordAlgorithm {
    return VALUES.includes(value as IPasswordAlgorithm);
  },

  /**
   * Returns all available algorithm values.
   */
  getAll(): PasswordAlgorithm[] {
    return VALUES as PasswordAlgorithm[];
  },

  // ================= Behavior Methods (State Logic) =================

  /**
   * Checks whether the algorithm is Bcrypt.
   */
  isBcrypt(algo: PasswordAlgorithm): boolean {
    return algo === this.Bcrypt;
  },

  /**
   * Checks whether the algorithm is Argon2.
   */
  isArgon2(algo: PasswordAlgorithm): boolean {
    return algo === this.Argon2;
  },

  /**
   * Checks whether the algorithm is Scrypt.
   */
  isScrypt(algo: PasswordAlgorithm): boolean {
    return algo === this.Scrypt;
  },

  /**
   * Checks whether the algorithm is considered secure (modern).
   * Bcrypt and Argon2 are considered secure.
   */
  isSecure(algo: PasswordAlgorithm): boolean {
    return this.isBcrypt(algo) || this.isArgon2(algo);
  },

  /**
   * Checks whether the algorithm is deprecated (should be migrated).
   */
  isDeprecated(algo: PasswordAlgorithm): boolean {
    return this.isScrypt(algo);
  },

  /**
   * Gets the recommended cost parameter (rounds or work factor) for server-side hashing.
   */
  getRecommendedCost(algo: PasswordAlgorithm): number {
    const map: Record<IPasswordAlgorithm, number> = {
      Bcrypt: 12, // bcrypt rounds
      Argon2: 3, // argon2 iterations
      Scrypt: 100000, // Scrypt iterations
    };
    return map[algo as IPasswordAlgorithm] ?? 100000;
  },
};
