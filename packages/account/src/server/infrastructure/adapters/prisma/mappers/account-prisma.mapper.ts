import type { Account as PrismaAccount } from '@memoflow/database';
import type { AccountState } from '../../../../domain';
import { Account } from '../../../../domain';
import { IdentityId } from '@memoflow/domain-shared/shared';
import {
  AccountProfile,
  AccountSettings,
  ContactEmail,
  AccountStatus,
  ContactPhone,
} from '../../../../domain/value-objects';
import type { AccountProfileDTO, AccountSettingsDTO } from '@memoflow/contracts/account';


/** Prisma Date/DateTime → Instant (epoch ms). Required fields never null. */
function requiredInstant(value: Date | string | number | null | undefined): number {
  if (value instanceof Date) return value.getTime();
  if (value == null) return Date.now();
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : Date.now();
}

/** Prisma Date/DateTime → Instant | null. */
function optionalInstant(value: Date | string | number | null | undefined): number | null {
  if (value == null) return null;
  if (value instanceof Date) return value.getTime();
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}


export class AccountPrismaMapper {
  static toDomain(row: PrismaAccount): Account {
    const profile = row.profile as unknown as AccountProfileDTO;
    const settings = row.settings as unknown as AccountSettingsDTO;

    const state: AccountState = {
      id: IdentityId.of(row.id),
      status: AccountStatus.of(row.status),
      profile: AccountProfile.create({
        nickname: profile.nickname,
        realName: profile.realName,
        avatarUrl: profile.avatarUrl,
        bio: profile.bio,
        gender: profile.gender,
        birthday: profile.birthday ?? null,
      }),
      settings: AccountSettings.create({
        theme: settings.theme,
        language: settings.language,
        timezone: settings.timezone,
        notificationEnabled: settings.notificationEnabled,
      }),
      email: ContactEmail.create({
        address: row.emailAddress,
        isVerified: row.emailIsVerified,
        verifiedAt: row.emailVerifiedAt ? new Date(row.emailVerifiedAt).getTime() : null,
        isPrimary: row.emailIsPrimary,
      }),
      phone: row.phoneNumber
        ? ContactPhone.create({
            fullNumber: row.phoneFullNumber as string,
            countryCode: row.phoneCountryCode as string,
            number: row.phoneNumber,
            isVerified: row.phoneIsVerified as boolean,
            verifiedAt: row.phoneVerifiedAt ? new Date(row.phoneVerifiedAt).getTime() : null,
          })
        : null,
      version: row.version,
      createdAt: requiredInstant(row.createdAt),
      updatedAt: requiredInstant(row.updatedAt),
      deletedAt: optionalInstant(row.deletedAt),
    };
    return Account.load(state);
  }
}
