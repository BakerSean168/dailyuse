import { ValueObject } from '@dailyuse/utils';
import type {
  EmailAddressDTO,
  EmailAddressPersistenceDTO,
  EmailAddress as IEmailAddress,
} from '@dailyuse/contracts/authentication';

/**
 * Email address value object.
 *
 * Validates email format and length, provides email-related business logic
 * (domain extraction, masking, etc.), and is immutable.
 */
export class EmailAddress extends ValueObject<EmailAddressDTO> implements IEmailAddress {
  private constructor(props: EmailAddressDTO) {
    super(props);
  }

  // ================= Factory Method 1: Standard Creation =================
  /**
   * Creates a new email address value object with validation.
   * @throws When the email format is invalid.
   */
  public static create(props: EmailAddressDTO): EmailAddress {
    this.validate(props);
    return new EmailAddress(props);
  }

  // ================= Factory Method 2: Restore from DTO =================
  /**
   * Restores an email address object from a DTO.
   * Used to reconstruct from API responses or client-side data.
   */
  public static fromDTO(dto: EmailAddressDTO): EmailAddress {
    return new EmailAddress(dto);
  }

  // ================= Getters =================
  public get value(): string {
    return this.props.value;
  }

  // ================= Internal Logic =================
  /**
   * Centralized validation logic.
   */
  private static validate(props: EmailAddressDTO): void {
    // Email format validation (simplified RFC 5322)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(props.value)) {
      throw new Error(`Invalid email address format: ${props.value}`);
    }

    // Email length validation (RFC 5321)
    if (props.value.length > 254) {
      throw new Error('Email address too long (max 254 characters)');
    }

    // Local part (before @) must not exceed 64 characters
    const [localPart] = props.value.split('@');
    if (localPart.length > 64) {
      throw new Error('Email local part too long (max 64 characters)');
    }

    // Must not be empty
    if (!props.value || props.value.trim().length === 0) {
      throw new Error('Email address cannot be empty');
    }
  }

  // ================= Computed Properties =================

  /**
   * Gets the domain part (after @).
   * @example 'user@example.com' => 'example.com'
   */
  public domain(): string {
    const parts = this.props.value.split('@');
    return parts.length > 1 ? parts[1] : '';
  }

  /**
   * Gets the local part (before @).
   * @example 'user.name@example.com' => 'user.name'
   */
  public getLocalPart(): string {
    const parts = this.props.value.split('@');
    return parts[0] || '';
  }

  /**
   * Gets a masked email address for UI display.
   * @example 'john@example.com' => 'j***n@example.com'
   */
  public getMaskedAddress(): string {
    const [localPart, domain] = this.props.value.split('@');
    if (!localPart || !domain) return this.props.value;

    // Show at least 1 character at start and end
    const visibleCount = Math.max(2, Math.ceil(localPart.length / 3));
    const maskedLocalPart =
      localPart.slice(0, 1) + '*'.repeat(localPart.length - 2) + localPart.slice(-1);

    return `${maskedLocalPart}@${domain}`;
  }

  /**
   * Checks whether this is a free email provider (e.g. Gmail, QQ, 163).
   */
  public isFreeEmail(): boolean {
    const domain = this.domain().toLowerCase();
    const freeEmailDomains = [
      'gmail.com',
      'qq.com',
      '163.com',
      '126.com',
      'foxmail.com',
      'hotmail.com',
      'outlook.com',
      'yahoo.com',
      'mail.com',
    ];
    return freeEmailDomains.includes(domain);
  }

  /**
   * Checks whether this is a corporate email (non-free provider).
   */
  public isCorporateEmail(): boolean {
    return !this.isFreeEmail();
  }

  // ================= Serialization: API / Client =================
  /**
   * Converts to a DTO for API transport.
   */
  public toDTO(): EmailAddressDTO {
    return { ...this.props };
  }

  // ================= Serialization: Persistence =================
  /**
   * Converts to persistence format for database storage.
   */
  public toPersistence(): EmailAddressPersistenceDTO {
    return {
      value: this.props.value,
    };
  }
}
