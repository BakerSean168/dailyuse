import type { AccountState } from '../../../../domain-server';
import { Account } from '../../../../domain-server';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import {
  AccountProfile,
  AccountSettings,
  ContactEmail,
  AccountStatus,
  ContactPhone,
} from '../../../../domain-shared';
import type {
  AccountProfilePersistenceDTO,
  AccountSettingsPersistenceDTO,
} from '@dailyuse/contracts/account';

export type PowerSyncAccountRow = {
  id: string;
  status: string;
  profile: string;
  settings: string;
  email_address: string;
  email_is_verified: number | boolean;
  email_verified_at: string | null;
  email_is_primary: number | boolean;
  phone_country_code: string | null;
  phone_number: string | null;
  phone_full_number: string | null;
  phone_is_verified: number | boolean | null;
  phone_verified_at: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export class AccountPowerSyncMapper {
  static toDomain(row: PowerSyncAccountRow): Account {
    const profile = this.parseJson<AccountProfilePersistenceDTO>(row.profile);
    const settings = this.parseJson<AccountSettingsPersistenceDTO>(row.settings);

    const state: AccountState = {
      id: IdentityId.of(row.id),
      status: AccountStatus.of(row.status),
      profile: AccountProfile.fromPersistenceDTO(profile),
      settings: AccountSettings.fromPersistenceDTO(settings),
      email: ContactEmail.fromPersistenceDTO({
        address: row.email_address,
        isVerified: this.toBoolean(row.email_is_verified),
        verifiedAt: row.email_verified_at ? new Date(row.email_verified_at) : null,
        isPrimary: this.toBoolean(row.email_is_primary),
      }),
      phone:
        row.phone_number && row.phone_country_code && row.phone_full_number
          ? ContactPhone.fromPersistenceDTO({
              countryCode: row.phone_country_code,
              number: row.phone_number,
              fullNumber: row.phone_full_number,
              isVerified: this.toBoolean(row.phone_is_verified),
              verifiedAt: row.phone_verified_at ? new Date(row.phone_verified_at) : null,
            })
          : null,
      version: Number(row.version),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    };

    return Account.load(state);
  }

  static toRow(account: Account): PowerSyncAccountRow {
    const email = account.email.toPersistenceDTO();
    const phone = account.phone?.toPersistenceDTO() ?? null;

    return {
      id: account.id.toString(),
      status: account.status.toString(),
      profile: JSON.stringify(account.profile.toPersistenceDTO()),
      settings: JSON.stringify(account.settings.toPersistenceDTO()),
      email_address: email.address,
      email_is_verified: this.toInteger(email.isVerified),
      email_verified_at: email.verifiedAt ? new Date(email.verifiedAt).toISOString() : null,
      email_is_primary: this.toInteger(email.isPrimary),
      phone_country_code: phone?.countryCode ?? null,
      phone_number: phone?.number ?? null,
      phone_full_number: phone?.fullNumber ?? null,
      phone_is_verified: phone ? this.toInteger(phone.isVerified) : null,
      phone_verified_at: phone?.verifiedAt ? new Date(phone.verifiedAt).toISOString() : null,
      version: account.version,
      created_at: account.createdAt.toISOString(),
      updated_at: account.updatedAt.toISOString(),
      deleted_at: account.deletedAt ? account.deletedAt.toISOString() : null,
    };
  }

  private static parseJson<T>(value: string): T {
    return JSON.parse(value) as T;
  }

  private static toBoolean(value: number | boolean | null | undefined): boolean {
    return value === true || value === 1;
  }

  private static toInteger(value: boolean): number {
    return value ? 1 : 0;
  }
}
