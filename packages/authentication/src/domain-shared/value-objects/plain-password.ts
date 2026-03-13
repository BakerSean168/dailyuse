import { ValueObject } from '@dailyuse/utils';
import type {
  PlainPasswordDTO,
  PlainPassword as IPlainPassword,
} from '@dailyuse/contracts/authentication';

/**
 * Plain password value object.
 *
 * Security warning: This object exists only briefly during user input.
 * Must never be persisted or transmitted over the network (use HTTPS).
 * Must be hashed immediately and then discarded.
 *
 * Validates password strength and length, provides password-related
 * business logic, and should be garbage collected after hashing.
 */
export class PlainPassword extends ValueObject<PlainPasswordDTO> implements IPlainPassword {
  private constructor(props: PlainPasswordDTO) {
    super(props);
  }

  // ================= Factory Method 1: Standard Creation =================
  /**
   * Creates a new plain password value object with validation.
   *
   * @throws When the password does not meet security requirements.
   *
   * This validation should also be implemented server-side for secondary verification.
   */
  public static create(props: PlainPasswordDTO): PlainPassword {
    this.validate(props);
    return new PlainPassword(props);
  }

  // ================= Internal Logic =================
  /**
   * Centralized validation logic - password strength checks.
   *
   * Validation rules:
   * 1. Minimum length: 8 characters
   * 2. Maximum length: 128 characters
   * 3. Must not be empty or whitespace-only
   * 4. Complexity level (optional, based on business requirements)
   */
  private static validate(props: PlainPasswordDTO): void {
    const password = props.value;

    // Must not be empty or whitespace-only
    if (!password || password.trim().length === 0) {
      throw new Error('Password cannot be empty');
    }

    // Minimum length check
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Maximum length check
    if (password.length > 128) {
      throw new Error('Password must not exceed 128 characters');
    }

    // Recommended: at least 2 of uppercase, lowercase, digit, and special character
    // (adjustable based on business requirements)
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const complexityCount = [hasUpperCase, hasLowerCase, hasDigit, hasSpecialChar].filter(
      Boolean,
    ).length;

    // Require at least 2 complexity categories (adjustable for stricter policies)
    if (complexityCount < 2) {
      throw new Error(
        'Password must contain at least 2 of: uppercase, lowercase, digit, special character',
      );
    }
  }

  // ===================== Getters =================
  public get value(): string {
    return this.props.value;
  }

  // ================= Computed Properties =================

  /**
   * 计算密码强度等级
   * @returns 'Weak' | 'Fair' | 'Good' | 'Strong'
   */
  public getStrength(): 'Weak' | 'Fair' | 'Good' | 'Strong' {
    const password = this.props.value;
    let score = 0;

    // Length scoring
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    // Complexity scoring
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;

    // Map to strength level
    if (score <= 2) return 'Weak';
    if (score <= 4) return 'Fair';
    if (score <= 6) return 'Good';
    return 'Strong';
  }

  /**
   * Gets the password strength as a percentage for UI progress bars.
   * @returns 0-100
   */
  public getStrengthPercentage(): number {
    const strength = this.getStrength();
    const map: Record<typeof strength, number> = {
      Weak: 25,
      Fair: 50,
      Good: 75,
      Strong: 100,
    };
    return map[strength];
  }

  /**
   * Checks whether the password contains common weak patterns.
   * @returns true if the password contains a weak pattern.
   */
  public hasCommonPatterns(): boolean {
    const password = this.props.value.toLowerCase();

    // Common weak patterns
    const commonPatterns = [
      'password',
      '123456',
      'qwerty',
      'abc123',
      'admin',
      'letmein',
      '111111',
      '000000',
    ];

    return commonPatterns.some((pattern) => password.includes(pattern));
  }

  // ================= Serialization =================
  /**
   * Converts to DTO.
   *
   * WARNING: This method should be called very rarely.
   * Passwords should not be serialized to the client or stored.
   * If transmission is necessary:
   * 1. Use HTTPS encryption
   * 2. Hash immediately on the server and discard the plaintext
   */
  public toDTO(): PlainPasswordDTO {
    return { ...this.props };
  }
}
