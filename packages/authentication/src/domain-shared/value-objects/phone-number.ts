import { ValueObject } from '@dailyuse/utils/domain';
import type {
  PhoneNumberDTO,
  PhoneNumber as IPhoneNumber,
} from '@dailyuse/contracts/authentication';

/**
 * Phone number value object.
 *
 * Validates phone number format and length, supports multiple countries
 * (primarily China), provides phone-related business logic (masking,
 * carrier detection, etc.), and is immutable.
 */
export class PhoneNumber extends ValueObject<PhoneNumberDTO> implements IPhoneNumber {
  private constructor(props: PhoneNumberDTO) {
    super(props);
  }

  // ================= Factory Method 1: Standard Creation =================
  /**
   * Creates a new phone number value object with validation.
   * @throws When the phone number format is invalid.
   */
  public static create(props: PhoneNumberDTO): PhoneNumber {
    this.validate(props);
    return new PhoneNumber(props);
  }

  // ================= Factory Method 2: Restore from DTO =================
  /**
   * Restores a phone number object from a DTO.
   */
  public static fromDTO(dto: PhoneNumberDTO): PhoneNumber {
    return new PhoneNumber(dto);
  }

  // ================= Getters =================
  public get value(): string {
    return this.props.value;
  }

  domain(): string {
    return this.props.value;
  }

  // ================= Internal Logic =================
  /**
   * Centralized validation logic.
   */
  private static validate(props: PhoneNumberDTO): void {
    // Strip all non-digit characters for validation
    const digitsOnly = props.value.replace(/\D/g, '');

    // China mobile phone validation (most common format)
    // Allows numbers starting with 13/14/15/16/17/18/19, 11 digits total
    const chinaPhoneRegex = /^1[3-9]\d{9}$/;
    if (!chinaPhoneRegex.test(digitsOnly)) {
      throw new Error(`Invalid phone number format: ${props.value}`);
    }

    // International format validation (optional + and country code)
    const internationalRegex = /^\+?[1-9]\d{1,14}$/;
    if (!internationalRegex.test(digitsOnly.replace('+', ''))) {
      throw new Error('Phone number must match international format');
    }
  }

  // ================= Computed Properties =================

  /**
   * Gets the phone number in digits-only format (all special characters removed).
   */
  public getDigitsOnly(): string {
    return this.props.value.replace(/\D/g, '');
  }

  /**
   * Gets the country code portion (if present).
   * @example '+86-13800000000' => '86'
   */
  public getCountryCode(): string {
    if (this.props.value.startsWith('+')) {
      const match = this.props.value.match(/^\+(\d+)/);
      return match ? match[1] : '86'; // Default: China
    }
    return '86'; // Default: China
  }

  /**
   * Gets a masked phone number for UI display.
   * @example '13800000000' => '138****0000'
   */
  public getMaskedNumber(): string {
    const digitsOnly = this.getDigitsOnly();
    if (digitsOnly.length < 8) return digitsOnly;

    const prefix = digitsOnly.slice(0, 3);
    const suffix = digitsOnly.slice(-4);
    const masked = '*'.repeat(digitsOnly.length - 7);

    return `${prefix}${masked}${suffix}`;
  }

  /**
   * Checks whether this is a China mainland phone number.
   */
  public isChinaMainland(): boolean {
    const digitsOnly = this.getDigitsOnly();
    return /^1[3-9]\d{9}$/.test(digitsOnly);
  }

  /**
   * Gets the carrier for China mainland phone numbers.
   * @returns 'ChinaMobile' | 'ChinaUnicom' | 'ChinaTelecom' | 'Unknown'
   */
  public getCarrier(): 'ChinaMobile' | 'ChinaUnicom' | 'ChinaTelecom' | 'Unknown' {
    if (!this.isChinaMainland()) {
      return 'Unknown';
    }

    const prefix = this.getDigitsOnly().slice(0, 3);

    // China Mobile: 134-139, 147, 150-152, 157-159, 178, 182-184, 187-188, 198
    if (
      [
        '134',
        '135',
        '136',
        '137',
        '138',
        '139',
        '147',
        '150',
        '151',
        '152',
        '157',
        '158',
        '159',
        '178',
        '182',
        '183',
        '184',
        '187',
        '188',
        '198',
      ].includes(prefix)
    ) {
      return 'ChinaMobile';
    }

    // China Unicom: 130-132, 155-156, 166, 171, 175-176, 185-186, 196
    if (
      ['130', '131', '132', '155', '156', '166', '171', '175', '176', '185', '186', '196'].includes(
        prefix,
      )
    ) {
      return 'ChinaUnicom';
    }

    // China Telecom: 133, 149, 153, 173, 177, 180-181, 189-191, 193, 199
    if (
      ['133', '149', '153', '173', '177', '180', '181', '189', '190', '191', '193', '199'].includes(
        prefix,
      )
    ) {
      return 'ChinaTelecom';
    }

    return 'Unknown';
  }

  // ================= Serialization: API / Client =================
  /**
   * Converts to a DTO for API transport.
   */
  public toDTO(): PhoneNumberDTO {
    return { ...this.props };
  }

}
