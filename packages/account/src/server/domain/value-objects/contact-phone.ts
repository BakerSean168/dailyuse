import { ValueObject } from '@memoflow/utils/domain';
import type { ContactPhoneDTO, ContactPhone as IContactPhone } from '@memoflow/contracts/account';
import type { Instant } from '@memoflow/contracts/primitives';

export class ContactPhone extends ValueObject<ContactPhoneDTO> implements IContactPhone {

  private constructor(props: ContactPhoneDTO) {
    super(props);
  }

  public static create(props: ContactPhoneDTO): ContactPhone {
    this.validate(props);
    return new ContactPhone(props);
  }

  public static createUnverified(countryCode: string, number: string, fullNumber: string): ContactPhone {
    const props: ContactPhoneDTO = { countryCode, number, fullNumber, isVerified: false, verifiedAt: null };
    this.validate(props);
    return new ContactPhone({ ...props, verifiedAt: null });
  }

  private static validate(props: ContactPhoneDTO): void {
    const phoneRegex = /^\d{11}$/;
    if (!phoneRegex.test(props.number)) {
      throw new Error(`Invalid phone number format: ${props.number} (must be 11 digits)`);
    }
    if (!props.countryCode || props.countryCode.length === 0) {
      throw new Error('Country code cannot be empty');
    }
    if (!props.fullNumber || props.fullNumber.length === 0) {
      throw new Error('Full phone number cannot be empty');
    }
  }

  public verify(): ContactPhone {
    return new ContactPhone({
      ...this.props,
      isVerified: true,
      verifiedAt: this.props.isVerified ? this.props.verifiedAt : Date.now(),
    });
  }

  public getFormattedNumber(): string {
    const { countryCode, number } = this.props;
    const formatted = number.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
    return `${countryCode} ${formatted}`;
  }

  public getMaskedNumber(): string {
    const { countryCode, number } = this.props;
    const masked = number.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    return `${countryCode} ${masked}`;
  }

  /** ADR-037: Instant epoch ms (no mutable Date leakage). */
  get verifiedAt(): Instant | null {
    return this.props.verifiedAt;
  }

  get countryCode(): string { return this.props.countryCode; }
  get number(): string { return this.props.number; }
  get fullNumber(): string { return this.props.fullNumber; }
  get isVerified(): boolean { return this.props.isVerified; }

  public toDTO(): ContactPhoneDTO {
    return { ...this.props };
  }
}
