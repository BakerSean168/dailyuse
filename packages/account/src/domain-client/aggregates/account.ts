/**
 * Account Aggregate Root - Domain Client
 *
 * Read-only client-side representation of the Account aggregate.
 */

import type { AccountClientDTO } from '@dailyuse/contracts/account';
import { AggregateRoot } from '@dailyuse/utils/domain';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import {
  AccountProfile,
  AccountSettings,
  ContactEmail,
  AccountStatus,
  ContactPhone,
} from '../../server/domain/value-objects';

export interface AccountState {
  id: IdentityId;
  profile: AccountProfile;
  email: ContactEmail;
  settings: AccountSettings;
  status: AccountStatus;
  phone: ContactPhone | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class Account extends AggregateRoot<IdentityId> {
  private readonly _props: AccountState;

  private constructor(props: AccountState) {
    super(props.id);
    this._props = props;
  }

  get profile(): AccountProfile {
    return this._props.profile;
  }
  get email(): ContactEmail {
    return this._props.email;
  }
  get settings(): AccountSettings {
    return this._props.settings;
  }
  get status(): AccountStatus {
    return this._props.status;
  }
  get phone(): ContactPhone | null {
    return this._props.phone;
  }
  get version(): number {
    return this._props.version;
  }
  get createdAt(): Date {
    return this._props.createdAt;
  }
  get updatedAt(): Date {
    return this._props.updatedAt;
  }
  get deletedAt(): Date | null {
    return this._props.deletedAt;
  }

  public static load(state: AccountState): Account {
    return new Account(state);
  }

  public toDTO(): AccountClientDTO {
    return {
      id: String(this.id) as AccountClientDTO['id'],
      status: this._props.status,
      profile: this._props.profile.toDTO(),
      settings: this._props.settings.toDTO(),
      email: this._props.email.toDTO(),
      phone: this._props.phone?.toDTO() ?? null,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
    };
  }
}
