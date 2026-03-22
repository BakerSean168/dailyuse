/** Account Aggregate Root - Server-side implementation. */

import type { AccountClientDTO, AccountServerDTO } from '@dailyuse/contracts/account';
import { AggregateRoot } from '@dailyuse/utils';

// IdentityId from shared primitives (cross-module shared type)
import { IdentityId } from '@dailyuse/domain-shared/shared';

import {
  AccountProfile,
  AccountSettings,
  ContactEmail,
  AccountStatus,
  ContactPhone,
} from '../../domain-shared';

import type { AccountEventMap } from '@dailyuse/contracts/account';

/** Domain state interface for the Account aggregate */
export interface AccountState {
  id: IdentityId;
  profile: AccountProfile;
  email: ContactEmail;
  settings: AccountSettings;
  status: AccountStatus;
  phone: ContactPhone | null;
  version: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Account extends AggregateRoot<IdentityId> {
  private _props: AccountState;

  private constructor(state: AccountState) {
    super(state.id);
    this._props = state;
  }

  // ================= Getters =================

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
  get deletedAt(): Date | null {
    return this._props.deletedAt;
  }
  get createdAt(): Date {
    return this._props.createdAt;
  }
  get updatedAt(): Date {
    return this._props.updatedAt;
  }

  // ================= Factory Methods =================

  public static create(params: { id: IdentityId; email: string }): Account {
    const now = new Date();
    const state: AccountState = {
      id: params.id,
      status: AccountStatus.Active,
      profile: AccountProfile.createDefault(params.email),
      settings: AccountSettings.createDefault(),
      email: ContactEmail.create({
        address: params.email,
        isVerified: false,
        verifiedAt: null,
        isPrimary: true,
      }),
      phone: null,
      version: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    const account = new Account(state);

    account.addDomainEvent<AccountEventMap['account:create']>('account:create', {
      identityId: params.id.toString(),
      accountId: account.id.toString(),
      account: account.toServerDTO(),
    });

    return account;
  }

  public static load(state: AccountState): Account {
    return new Account(state);
  }

  // ================= Business Operations =================

  private refreshUpdatedAt(): void {
    this._props.updatedAt = new Date();
  }

  public updateProfile(profile: AccountProfile): void {
    this._props.profile = profile;
    this.refreshUpdatedAt();

    this.addDomainEvent<AccountEventMap['account:update-profile']>('account:update-profile', {
      identityId: this.id.toString(),
      accountId: this.id.toString(),
      account: this.toServerDTO(),
      changes: ['profile'],
    });
  }

  public updateSettings(settings: AccountSettings): void {
    this._props.settings = settings;
    this.refreshUpdatedAt();

    this.addDomainEvent<AccountEventMap['account:update-settings']>('account:update-settings', {
      identityId: this.id.toString(),
      accountId: this.id.toString(),
      account: this.toServerDTO(),
      settingKeys: ['settings'],
    });
  }

  public close(): void {
    if (this._props.status === AccountStatus.Deactivated) {
      throw new Error('Account is already closed.');
    }
    if (this._props.status === AccountStatus.Suspended) {
      throw new Error('Cannot close a suspended account. Please contact support.');
    }

    this._props.status = AccountStatus.Deactivated;
    this.refreshUpdatedAt();

    this.addDomainEvent<AccountEventMap['account:close']>('account:close', {
      identityId: this.id.toString(),
      accountId: this.id.toString(),
      account: this.toServerDTO(),
      reason: 'User initiated closure',
      closedAt: this.updatedAt.getTime(),
    });
  }

  // ================= Serialization =================

  public toServerDTO(): AccountServerDTO {
    return {
      id: this.id,
      status: this._props.status,
      profile: this._props.profile.toDTO(),
      settings: this._props.settings.toDTO(),
      email: this._props.email.toDTO(),
      phone: this._props.phone ? this._props.phone.toDTO() : null,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt ? this._props.deletedAt.getTime() : null,
    };
  }

  public toClientDTO(): AccountClientDTO {
    return {
      id: this.id,
      status: this._props.status,
      profile: this._props.profile.toDTO(),
      settings: this._props.settings.toDTO(),
      email: this._props.email.toDTO(),
      phone: this._props.phone ? this._props.phone.toDTO() : null,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt ? this._props.deletedAt.getTime() : null,
    };
  }
}
