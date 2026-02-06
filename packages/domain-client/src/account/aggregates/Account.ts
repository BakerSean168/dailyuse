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

// 内部状态接口：使用 domain-shared 类类型（有 .toDTO() 等方法）
interface AccountState {
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

export class Account extends AggregateRoot<IdentityId> implements AccountClient {
  private readonly _props: AccountState;

  private constructor(props: AccountState) {
    super(props.id);
    this._props = props;
  }

  // ===== Getters =====

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

  // ===== Factory Methods =====

  public static fromDTO(dto: AccountClientDTO): Account {
    return new Account({
      id: IdentityId.of(dto.id),
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
