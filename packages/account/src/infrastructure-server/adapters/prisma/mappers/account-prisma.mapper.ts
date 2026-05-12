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
    const profile = row.profile as any;
    const settings = row.settings as any;

    const state: AccountState = {
      id: IdentityId.of(row.id),
      status: AccountStatus.of(row.status),
      profile: AccountProfile.create({
        nickname: profile.nickname,
        realName: profile.realName,
        avatarUrl: profile.avatarUrl,
        bio: profile.bio,
        gender: profile.gender,
        birthday: profile.birthday ? new Date(profile.birthday).getTime() : null,
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
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    };
    return Account.load(state);
  }
}
