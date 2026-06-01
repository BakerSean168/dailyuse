import { ValueObject } from '@dailyuse/utils/domain';
import type { ContactEmailDTO, ContactEmail as IContactEmail } from '@dailyuse/contracts/account';
import type { DomainDate } from '@dailyuse/contracts/primitives';

export class ContactEmail extends ValueObject<ContactEmailDTO> implements IContactEmail {

  private constructor(props: ContactEmailDTO) {
    super(props);
  }

  public static create(props: ContactEmailDTO): ContactEmail {
    this.validate(props);
    return new ContactEmail(props);
  }

  public static createUnverified(address: string): ContactEmail {
    this.validate({ address, isVerified: false, isPrimary: true, verifiedAt: null });
    return new ContactEmail({
      address,
      isVerified: false,
      isPrimary: true,
      verifiedAt: null,
    });
  }

  private static validate(props: ContactEmailDTO): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(props.address)) {
      throw new Error(`Invalid email address format: ${props.address}`);
    }
    if (props.address.length > 255) {
      throw new Error('Email address too long (max 255 characters)');
    }
  }

  public verify(): ContactEmail {
    return new ContactEmail({
      ...this.props,
      isVerified: true,
      verifiedAt: this.props.isVerified ? this.props.verifiedAt : Date.now(),
    });
  }

  public markAsPrimary(): ContactEmail {
    return new ContactEmail({ ...this.props, isPrimary: true });
  }

  public unmarkAsPrimary(): ContactEmail {
    return new ContactEmail({ ...this.props, isPrimary: false });
  }

  public getMaskedAddress(): string {
    const [user, domain] = this.props.address.split('@');
    return `${user.slice(0, 1)}***${user.slice(-1)}@${domain}`;
  }

  public getLocalPart(): string {
    return this.props.address.split('@')[0];
  }

  public getDomain(): string {
    return this.props.address.split('@')[1];
  }

  get verifiedAt(): DomainDate | null {
    return this.props.verifiedAt ? new Date(this.props.verifiedAt) : null;
  }

  get isVerified(): boolean { return this.props.isVerified; }
  get isPrimary(): boolean { return this.props.isPrimary; }
  get address(): string { return this.props.address; }

  public toDTO(): ContactEmailDTO {
    return { ...this.props };
  }
}
