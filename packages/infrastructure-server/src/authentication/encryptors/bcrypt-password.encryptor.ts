/**
 * Bcrypt Password Encryptor
 *
 * Password hashing and verification using bcrypt.
 * Provides secure password encryption for authentication.
 */

import * as bcrypt from 'bcryptjs';
import type { IPasswordEncryptor } from '../ports/password-encryptor.port';

/**
 * Bcrypt Password Encryptor Implementation
 *
 * Uses bcryptjs for password hashing with configurable salt rounds.
 * Default salt rounds: 12 (recommended for production)
 */
export class BcryptPasswordEncryptor implements IPasswordEncryptor {
  private readonly saltRounds: number;

  constructor(saltRounds: number = 12) {
    if (saltRounds < 10 || saltRounds > 14) {
      console.warn(
        `[BcryptPasswordEncryptor] Salt rounds ${saltRounds} outside recommended range (10-14). Using default: 12`,
      );
      this.saltRounds = 12;
    } else {
      this.saltRounds = saltRounds;
    }
  }

  /**
   * Hash a plain text password using bcrypt
   *
   * @param password - Plain text password to hash
   * @returns Promise<string> - Bcrypt hash
   * @throws Error if password is invalid or hashing fails
   */
  async hash(password: string): Promise<string> {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (password.length > 72) {
      // Bcrypt limitation: passwords longer than 72 bytes are truncated
      console.warn('[BcryptPasswordEncryptor] Password longer than 72 characters will be truncated by bcrypt');
    }

    try {
      const salt = await bcrypt.genSalt(this.saltRounds);
      const hash = await bcrypt.hash(password, salt);
      return hash;
    } catch (error) {
      console.error('[BcryptPasswordEncryptor] Hashing failed:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(`Password hashing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Verify a plain text password against a bcrypt hash
   *
   * @param password - Plain text password to verify
   * @param hash - Bcrypt hash to compare against
   * @returns Promise<boolean> - True if password matches hash
   * @throws Error if verification fails (not if password doesn't match)
   */
  async verify(password: string, hash: string): Promise<boolean> {
    if (!password || typeof password !== 'string') {
      return false;
    }

    if (!hash || typeof hash !== 'string') {
      return false;
    }

    // Validate hash format (bcrypt hashes start with $2a$, $2b$, or $2y$)
    if (!hash.match(/^\$2[aby]\$\d{2}\$/)) {
      console.warn('[BcryptPasswordEncryptor] Invalid bcrypt hash format');
      return false;
    }

    try {
      const isMatch = await bcrypt.compare(password, hash);
      return isMatch;
    } catch (error) {
      console.error('[BcryptPasswordEncryptor] Verification failed:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Don't throw on verification failure - return false instead
      // This prevents timing attacks and information leakage
      return false;
    }
  }

  /**
   * Get bcrypt configuration
   *
   * @returns {{ saltRounds: number }} - Encryptor configuration
   */
  getConfig(): { saltRounds: number } {
    return {
      saltRounds: this.saltRounds,
    };
  }

  /**
   * Validate password strength (basic validation)
   *
   * Note: Full password strength validation should be done in application layer
   * This provides basic checks only
   *
   * @param password - Password to validate
   * @returns {{ isValid: boolean; errors: string[] }}
   */
  validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!password || typeof password !== 'string') {
      errors.push('Password must be a string');
      return { isValid: false, errors };
    }

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 72) {
      errors.push('Password must not exceed 72 characters (bcrypt limitation)');
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Check for at least one letter
    if (!/[a-zA-Z]/.test(password)) {
      errors.push('Password must contain at least one letter');
    }

    // Check for at least one special character (optional but recommended)
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password should contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Create a default bcrypt password encryptor instance
 *
 * @param saltRounds - Number of salt rounds (default: 12)
 * @returns BcryptPasswordEncryptor instance
 */
export function createBcryptEncryptor(saltRounds?: number): BcryptPasswordEncryptor {
  return new BcryptPasswordEncryptor(saltRounds);
}
