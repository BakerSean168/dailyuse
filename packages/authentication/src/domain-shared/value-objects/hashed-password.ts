import { ValueObject } from '@dailyuse/utils/domain';
import type {
  HashedPasswordDTO,
  HashedPassword as IHashedPassword,
} from '@dailyuse/contracts/authentication';
import { PasswordAlgorithm } from './password-algorithm';
import { PlainPassword } from './plain-password';
import type { IPasswordHasher } from '../services/i-password-hasher.service';
/**
 * Hashed password value object.
 *
 * Security note: This object exists only on the server side.
 * Contains sensitive data (hash and salt) that must never be sent to the client.
 * Used for password verification comparisons.
 *
 * Stores the hashed password and salt, provides password-related business logic,
 * and is immutable - all modifications return a new instance.
 */
export class HashedPassword extends ValueObject<HashedPasswordDTO> implements IHashedPassword {
  private constructor(props: HashedPasswordDTO) {
    super(props);
  }

  /**
   * Async factory: creates a hashed password from a plain password.
   * This is the only place where the hashing computation occurs.
   */
  public static async create(
    rawPassword: PlainPassword,
    hasher: IPasswordHasher,
  ): Promise<HashedPassword> {
    // 1. Perform the hashing algorithm
    const hashString = await hasher.hash(rawPassword.value);

    // 2. Extract salt from PHC format hash
    // Format: $argon2id$v=19$m=65536,t=3,p=4$salt$hash
    const parts = hashString.split('$');
    if (parts.length < 6) {
      throw new Error('Invalid argon2 hash format');
    }
    const salt = parts[4]; // base64-encoded salt

    // 3. Return the wrapped value object
    return new HashedPassword({
      hash: hashString,
      salt,
      algorithm: PasswordAlgorithm.Argon2, // Use Argon2 algorithm
      createdAt: Date.now(),
    });
  }

  // ================= Factory Method 2: Restore from DTO =================
  /**
   * Restores a hashed password object from a DTO.
   */
  public static fromDTO(dto: HashedPasswordDTO): HashedPassword {
    return new HashedPassword(dto);
  }

  // ================= Factory Method 3: Create Default =================
  /**
   * Creates a placeholder hashed password for accounts that have never set a password.
   * This password will never match any input.
   */
  public static createPlaceholder(): HashedPassword {
    return new HashedPassword({
      hash: '',
      salt: '',
      algorithm: PasswordAlgorithm.Argon2,
      createdAt: Date.now(),
    });
  }

  // ================= Getters =================
  public get hash(): string {
    return this.props.hash;
  }

  public get salt(): string {
    return this.props.salt;
  }

  public get algorithm(): typeof this.props.algorithm {
    return this.props.algorithm;
  }

  public get createdAt(): number {
    return this.props.createdAt;
  }

  // ================= Internal Logic =================
  /**
   * Centralized validation logic.
   */
  private static validate(props: HashedPasswordDTO): void {
    // Hash value must not be empty
    if (!props.hash || props.hash.trim().length === 0) {
      throw new Error('Hash value cannot be empty');
    }

    // Salt value must not be empty
    if (!props.salt || props.salt.trim().length === 0) {
      throw new Error('Salt value cannot be empty');
    }

    // Algorithm must be a known value
    if (!PasswordAlgorithm.isValid(props.algorithm)) {
      throw new Error(`Unknown password algorithm: ${props.algorithm}`);
    }

    // Creation timestamp must be valid
    if (!Number.isFinite(props.createdAt) || props.createdAt < 0) {
      throw new Error('Invalid creation timestamp');
    }

    // Creation time must not be too far in the future (allow some clock skew)
    const MAX_CLOCK_SKEW = 60000; // 1 minute
    if (props.createdAt > Date.now() + MAX_CLOCK_SKEW) {
      throw new Error('Creation timestamp is in the future');
    }
  }

  // ================= Computed Properties =================

  /**
   * Gets the algorithm used for hashing.
   */
  public getAlgorithm(): typeof this.props.algorithm {
    return this.props.algorithm;
  }

  /**
   * Checks whether the password uses a modern (secure) algorithm.
   */
  public usesModernAlgorithm(): boolean {
    return PasswordAlgorithm.isSecure(PasswordAlgorithm.of(this.props.algorithm));
  }

  /**
   * Checks whether the password uses a deprecated algorithm (should be migrated).
   */
  public usesDeprecatedAlgorithm(): boolean {
    return PasswordAlgorithm.isDeprecated(PasswordAlgorithm.of(this.props.algorithm));
  }

  /**
   * Gets the number of days since the password was created.
   */
  public getDaysSinceCreation(): number {
    const dayMs = 24 * 60 * 60 * 1000;
    return Math.floor((Date.now() - this.props.createdAt) / dayMs);
  }

  /**
   * Checks whether the password needs to be reset (e.g. older than 90 days).
   * @param maxAgeDays - Maximum password age in days before reset is required.
   */
  public needsReset(maxAgeDays: number = 90): boolean {
    return this.getDaysSinceCreation() > maxAgeDays;
  }

  // ================= Behavior Methods =================

  /**
   * Updates the password hash with a new value.
   * Used when a user changes their password.
   * @throws When the new hash value is invalid.
   */
  public updateHash(
    newHash: string,
    newSalt: string,
    algorithm: typeof this.props.algorithm,
  ): HashedPassword {
    HashedPassword.validate({
      hash: newHash,
      salt: newSalt,
      algorithm,
      createdAt: Date.now(),
    });

    return new HashedPassword({
      hash: newHash,
      salt: newSalt,
      algorithm,
      createdAt: Date.now(),
    });
  }

  /**
   * Checks whether the algorithm should be migrated.
   * E.g. from an older algorithm (PBKDF2) to a modern one (Argon2).
   */
  public shouldMigrateAlgorithm(): boolean {
    return this.usesDeprecatedAlgorithm();
  }

  // ================= Serialization: API / Client =================
  /**
   * Converts to DTO.
   *
   * WARNING: The returned DTO contains sensitive information.
   * Must never be sent to the client. Server-side internal use only.
   */
  public toDTO(): HashedPasswordDTO {
    return { ...this.props };
  }

}
