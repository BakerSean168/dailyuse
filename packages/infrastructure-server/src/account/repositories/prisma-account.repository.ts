import { PrismaClient } from '@prisma/client';
import type {
  IAccountRepository,
  AccountPrismaTransactionClient as PrismaTransactionClient,
} from '@dailyuse/domain-server/account';
import { Account } from '@dailyuse/domain-server/account';
import type { AccountServerDTO } from '@dailyuse/contracts/account';

/**
 * Account 聚合根 Prisma 仓储实现
 * 负责 Account 及其所有子实体的完整持久化
 */
export class PrismaAccountRepository implements IAccountRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 数据映射方法 =====

  /**
   * 将 Prisma 数据映射为 Account 聚合根实体
   */
  private mapAccountToEntity(data: any): Account {
    return Account.fromPersistenceDTO({
      uuid: data.uuid,
      username: data.username,
      email: data.email,
      emailVerified: data.emailVerified,
      phoneNumber: data.phoneNumber,
      phoneVerified: data.phoneVerified,
      status: data.status,
      displayName: JSON.parse(data.profile).displayName,
      avatar: JSON.parse(data.profile).avatar,
      bio: JSON.parse(data.profile).bio,
      location: JSON.parse(data.profile).location,
      timezone: JSON.parse(data.profile).timezone,
      language: JSON.parse(data.profile).language,
      dateOfBirth: JSON.parse(data.profile).dateOfBirth,
      gender: JSON.parse(data.profile).gender,
      preferences: data.preferences,
      storageUsed: JSON.parse(data.storage).used,
      storageQuota: JSON.parse(data.storage).quota,
      storageQuotaType: JSON.parse(data.storage).quotaType,
      twoFactorEnabled: JSON.parse(data.security).twoFactorEnabled,
      lastPasswordChange: JSON.parse(data.security).lastPasswordChange,
      loginAttempts: JSON.parse(data.security).loginAttempts,
      lockedUntil: JSON.parse(data.security).lockedUntil,
      history: data.history,
      statsTotalGoals: JSON.parse(data.stats).totalGoals,
      statsTotalTasks: JSON.parse(data.stats).totalTasks,
      statsTotalSchedules: JSON.parse(data.stats).totalSchedules,
      statsTotalReminders: JSON.parse(data.stats).totalReminders,
      statsLastLoginAt: JSON.parse(data.stats).lastLoginAt,
      statsLoginCount: JSON.parse(data.stats).loginCount,
      createdAt: data.createdAt.getTime(),
      updatedAt: data.updatedAt.getTime(),
      lastActiveAt: data.lastActiveAt ? data.lastActiveAt.getTime() : null,
      deletedAt: data.deletedAt ? data.deletedAt.getTime() : null,
    });
  }

  // ===== IAccountRepository 接口实现 =====

  async save(account: Account, tx?: PrismaTransactionClient): Promise<void> {
    const client = tx || this.prisma;
    const persistence = account.toPersistenceDTO();
    const data = {
      uuid: persistence.uuid,
      username: persistence.username,
      email: persistence.email,
      emailVerified: persistence.emailVerified,
      phoneNumber: persistence.phoneNumber,
      phoneVerified: persistence.phoneVerified,
      status: persistence.status,
      profile: JSON.stringify(account.profile),
      preferences: persistence.preferences,
      storage: JSON.stringify(account.storage),
      security: JSON.stringify(account.security),
      history: persistence.history,
      stats: JSON.stringify(account.stats),
      createdAt: new Date(persistence.createdAt),
      updatedAt: new Date(persistence.updatedAt),
      lastActiveAt: persistence.lastActiveAt ? new Date(persistence.lastActiveAt) : null,
      deletedAt: persistence.deletedAt ? new Date(persistence.deletedAt) : null,
    };

    await client.account.upsert({
      where: { uuid: persistence.uuid },
      create: data,
      update: {
        ...data,
        uuid: undefined,
        createdAt: undefined,
      },
    });
  }

  async findById(uuid: string, tx?: PrismaTransactionClient): Promise<Account | null> {
    const client = tx || this.prisma;
    const data = await client.account.findUnique({
      where: { uuid },
    });

    if (!data) {
      return null;
    }

    return this.mapAccountToEntity(data);
  }

  async findByUsername(username: string, tx?: PrismaTransactionClient): Promise<Account | null> {
    const client = tx || this.prisma;
    const data = await client.account.findUnique({
      where: { username },
    });

    if (!data) {
      return null;
    }

    return this.mapAccountToEntity(data);
  }

  async findByEmail(email: string, tx?: PrismaTransactionClient): Promise<Account | null> {
    const client = tx || this.prisma;
    const data = await client.account.findUnique({
      where: { email },
    });

    if (!data) {
      return null;
    }

    return this.mapAccountToEntity(data);
  }

  async findByPhone(phoneNumber: string, tx?: PrismaTransactionClient): Promise<Account | null> {
    const client = tx || this.prisma;
    const data = await client.account.findFirst({
      where: { phoneNumber },
    });

    if (!data) {
      return null;
    }

    return this.mapAccountToEntity(data);
  }

  async existsByUsername(username: string, tx?: PrismaTransactionClient): Promise<boolean> {
    const client = tx || this.prisma;
    const count = await client.account.count({
      where: { username },
    });
    return count > 0;
  }

  async existsByEmail(email: string, tx?: PrismaTransactionClient): Promise<boolean> {
    const client = tx || this.prisma;
    const count = await client.account.count({
      where: { email },
    });
    return count > 0;
  }

  async delete(uuid: string, tx?: PrismaTransactionClient): Promise<void> {
    const client = tx || this.prisma;
    await client.account.delete({
      where: { uuid },
    });
  }

  async findAll(
    options?: {
      page?: number;
      pageSize?: number;
      status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
    },
    tx?: PrismaTransactionClient,
  ): Promise<{ accounts: Account[]; total: number }> {
    const client = tx || this.prisma;
    const where = options?.status ? { status: options.status } : {};
    const skip = options?.page && options?.pageSize ? (options.page - 1) * options.pageSize : 0;
    const take = options?.pageSize ?? 20;

    const [accounts, total] = await Promise.all([
      client.account.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      client.account.count({ where }),
    ]);

    return {
      accounts: accounts.map((data: any) => this.mapAccountToEntity(data)),
      total,
    };
  }
}

