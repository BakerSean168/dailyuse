import type { AccountState } from '../../../../domain-server';
import { Account } from '../../../../domain-server';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import {
  AccountProfile,
  AccountSettings,
  ContactEmail,
  AccountStatus,
} from '../../../../domain-shared';

import type { AccountRow } from '../account-sqlite.repository';

export class AccountSqliteMapper {
  static toDomain(row: AccountRow): Account {
    const status = this.normalizeStatus(row.status);
    const email = row.email ?? `${row.id}@local.dailyuse`;

    const state: AccountState = {
      id: IdentityId.of(row.id),
      status: AccountStatus.of(status),
      profile: AccountProfile.fromPersistenceDTO({
        nickname: row.username,
        realName: row.display_name,
        avatarUrl: row.avatar_url,
        bio: null,
        gender: 'PreferNotToSay',
        birthday: null,
      }),
      settings: AccountSettings.fromPersistenceDTO({
        theme: 'System',
        language: (row.locale as any) || 'zh-CN',
        timezone: row.timezone || 'Asia/Shanghai',
        notificationEnabled: true,
      }),
      email: ContactEmail.fromPersistenceDTO({
        address: email,
        isVerified: false,
        verifiedAt: null,
        isPrimary: true,
      }),
      phone: null,
      version: 1,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deletedAt: null,
    };

    return Account.load(state);
  }

  private static normalizeStatus(
    status: string | null | undefined,
  ): 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED' {
    if (status === 'SUSPENDED') {
      return 'SUSPENDED';
    }
    if (status === 'DEACTIVATED' || status === 'DELETED' || status === 'INACTIVE') {
      return 'DEACTIVATED';
    }
    return 'ACTIVE';
  }
}
