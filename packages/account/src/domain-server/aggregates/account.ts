/**
 * Account 聚合根实�?
 */

import type {
  AccountClientDTO,
  AccountPersistenceDTO,
  AccountServer,
  AccountServerDTO,
} from '@dailyuse/contracts/account';
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

/** 内部状态接�?*/
interface AccountState {
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

export class Account extends AggregateRoot<IdentityId> implements AccountServer {

  private _props: AccountState;

  private constructor(props: AccountServerDTO) {
    const id = IdentityId.of(props.id);
    super(id);

    this._props = {
      id,
      profile: AccountProfile.create(props.profile),
      email: ContactEmail.create(props.email),
      settings: AccountSettings.create(props.settings),
      status: AccountStatus.of(props.status),
      phone: props.phone ? ContactPhone.create(props.phone) : null,
      version: props.version,
      deletedAt: props.deletedAt ? new Date(props.deletedAt) : null,
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt),
    };
  }

  // ================= Getters =================

  get profile(): AccountProfile { return this._props.profile; }
  get email(): ContactEmail { return this._props.email; }
  get settings(): AccountSettings { return this._props.settings; }
  get status(): AccountStatus { return this._props.status; }
  get phone(): ContactPhone | null { return this._props.phone; }
  get version(): number { return this._props.version; }
  get deletedAt(): Date | null { return this._props.deletedAt; }
  get createdAt(): Date { return this._props.createdAt; }
  get updatedAt(): Date { return this._props.updatedAt; }

  // ================= 工厂方法 =================

  public static create(params: {
    id: IdentityId;
    email: string;
  }): Account {
    const now = Date.now();
    const dto: AccountServerDTO = {
      id: params.id.toString(),
      status: AccountStatus.ACTIVE,
      profile: AccountProfile.createDefault(params.email).toDTO(),
      settings: AccountSettings.createDefault().toDTO(),
      email: {
        address: params.email,
        isVerified: false,
        verifiedAt: null,
        isPrimary: true,
      },
      phone: null,
      version: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    const account = new Account(dto);

    account.addDomainEvent<AccountEventMap['account:create']>('account:create', {
      identityId: params.id.toString(),
    });

    return account;
  }

  public static fromPersistenceDTO(dto: AccountPersistenceDTO): Account {
    const serverDTO: AccountServerDTO = {
      id: dto.id,
      status: dto.status,
      profile: AccountProfile.fromPersistenceDTO(dto.profile).toDTO(),
      settings: AccountSettings.fromPersistenceDTO(dto.settings).toDTO(),
      email: ContactEmail.fromPersistenceDTO(dto.email).toDTO(),
      phone: dto.phone ? ContactPhone.fromPersistenceDTO(dto.phone).toDTO() : null,
      version: dto.version,
      createdAt: dto.createdAt.getTime(),
      updatedAt: dto.updatedAt.getTime(),
      deletedAt: dto.deletedAt ? dto.deletedAt.getTime() : null,
    };
    return new Account(serverDTO);
  }

  // ================= 业务行为 =================

  private refreshUpdatedAt(): void {
    this._props.updatedAt = new Date();
  }

  public close(): void {
    if (this._props.status === AccountStatus.DEACTIVATED) {
      throw new Error('Account is already closed.');
    }
    if (this._props.status === AccountStatus.SUSPENDED) {
      throw new Error('Cannot close a suspended account. Please contact support.');
    }

    this._props.status = AccountStatus.DEACTIVATED;
    this.refreshUpdatedAt();

    this.addDomainEvent<AccountEventMap['account:close']>('account:close', {
      reason: 'User initiated closure',
    });
  }

  // ================= 序列�?=================

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

  public toPersistenceDTO(): AccountPersistenceDTO {
    return {
      id: this.id,
      status: this._props.status,
      profile: this._props.profile.toPersistenceDTO(),
      settings: this._props.settings.toPersistenceDTO(),
      email: this._props.email.toPersistenceDTO(),
      phone: this._props.phone ? this._props.phone.toPersistenceDTO() : null,
      version: this._props.version,
      createdAt: this._props.createdAt,
      updatedAt: this._props.updatedAt,
      deletedAt: this._props.deletedAt,
    };
  }
}
