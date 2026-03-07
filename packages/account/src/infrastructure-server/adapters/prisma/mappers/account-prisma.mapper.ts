import type { Account as PrismaAccount } from '@dailyuse/database';
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

export class AccountPrismaMapper {
  static toDomain(row: PrismaAccount): Account {
    const state: AccountState = {
      id: IdentityId.of(row.id),
      status: AccountStatus.of(row.status),
      profile: AccountProfile.fromPersistenceDTO(row.profile as any),
      settings: AccountSettings.fromPersistenceDTO(row.settings as any),
      email: ContactEmail.fromPersistenceDTO({
        address: row.emailAddress,
        isVerified: row.emailIsVerified,
        verifiedAt: row.emailVerifiedAt,
        isPrimary: row.emailIsPrimary,
      }),
      phone: row.phoneNumber
        ? ContactPhone.fromPersistenceDTO({
            fullNumber: row.phoneFullNumber as string,
            countryCode: row.phoneCountryCode as string,
            number: row.phoneNumber,
            isVerified: row.phoneIsVerified as boolean,
            verifiedAt: row.phoneVerifiedAt,
          })
        : null,
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    };
    return Account.load(state);
  }
}
