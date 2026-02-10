/**
 * UserSetting Prisma Repository
 *
 * Prisma implementation of IUserSettingRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type { IUserSettingRepository } from '../../ports/user-setting-repository.port';
import type { UserSetting } from '@/domain-server';

/**
 * UserSetting Prisma Repository
 *
 * Skeleton implementation - to be completed when extracting from apps/api.
 */
export class UserSettingPrismaRepository implements IUserSettingRepository {
  constructor(private readonly prisma: any) {}

  async findByAccountUuid(accountUuid: string): Promise<UserSetting | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async save(setting: UserSetting): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async delete(accountUuid: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }
}
