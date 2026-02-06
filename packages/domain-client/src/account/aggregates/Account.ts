/**
 * Account Aggregate Root - Domain Client
 * 账户聚合根 - 领域客户端
 */

import type {
  AccountClient,
  AccountClientDTO,
} from '@dailyuse/contracts/account';
import { AggregateRoot } from '@dailyuse/utils';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import {
  AccountProfile,
  AccountSettings,
  ContactEmail,
  AccountStatus,
  ContactPhone,
} from '@dailyuse/domain-shared/account';

export class Account extends AggregateRoot<IdentityId> implements AccountClient {
  private _profile: AccountProfile;
  private _email: ContactEmail;
  private _settings: AccountSettings;
  private _status: AccountStatus;
  private _phone: ContactPhone | null;
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  private constructor(params: {
    id: string;
    profile: AccountProfile;
    email: ContactEmail;
    settings: AccountSettings;
    status: AccountStatus;
    phone: ContactPhone | null;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }) {
    super(IdentityId.of(params.id));
    this._profile = params.profile;
    this._email = params.email;
    this._settings = params.settings;
    this._status = params.status;
    this._phone = params.phone;
    this._version = params.version;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
  }

  // ===== Getters =====

  get profile(): AccountProfile {
    return this._profile;
  }

  get email(): ContactEmail {
    return this._email;
  }

  get settings(): AccountSettings {
    return this._settings;
  }

  get status(): AccountStatus {
    return this._status;
  }

  get phone(): ContactPhone | null {
    return this._phone;
  }

  get version(): number {
    return this._version;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  // ===== Factory Methods =====

  public static fromDTO(dto: AccountClientDTO): Account {
    return new Account({
      id: dto.id,
      profile: AccountProfile.create(dto.profile),
      email: ContactEmail.create(dto.email),
      settings: AccountSettings.create(dto.settings),
      status: AccountStatus.of(dto.status),
      phone: dto.phone ? ContactPhone.create(dto.phone) : null,
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    });
  }

  // ===== DTO Conversion =====

  public toDTO(): AccountClientDTO {
    return {
      id: String(this.id),
      status: this._status,
      profile: this._profile.toDTO(),
      settings: this._settings.toDTO(),
      email: this._email.toDTO(),
      phone: this._phone?.toDTO() ?? null,
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
    };
  }
}
