/**
 * Password Encryptor Port
 *
 * Interface for password hashing and verification.
 */

export interface IPasswordEncryptor {
  /**
   * Hash a plain text password
   * @param password - Plain text password
   * @returns Promise<string> - Hashed password
   */
  hash(password: string): Promise<string>;

  /**
   * Verify a password against its hash
   * @param password - Plain text password
   * @param hash - Hashed password
   * @returns Promise<boolean> - True if password matches hash
   */
  verify(password: string, hash: string): Promise<boolean>;

  /**
   * Get encryptor configuration
   */
  getConfig(): { saltRounds: number };
}
