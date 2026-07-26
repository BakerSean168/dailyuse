/**
 * PrismaAccountRepository
 *
 * Prisma implementation of IAccountRepository.
 * Receives PrismaClient via constructor injection from @dailyuse/database.
 *
 * Extends AggregateRepositoryBase to automatically publish domain events after persistence.
 */

import type { PrismaClient, Account as PrismaAccount, Prisma } from '@dailyuse/database';
import type { AccountProfileDTO, AccountSettingsDTO } from '@dailyuse/contracts/account';
import type { IAccountRepository } from '../../../domain';
import { Account } from '../../../domain';
import { AccountPrismaMapper } from './mappers/account-prisma.mapper';
import { AggregateRepositoryBase, createEventBusAdapter, publishAggregateEvents } from '@dailyuse/patterns';
import { eventBus } from '@dailyuse/utils/domain';

const eventBusAdapter = createEventBusAdapter(eventBus);

/**
 * Minimal DB capability interface for Account repository.
 * Both PrismaClient and Prisma.TransactionClient satisfy this.
 */
interface AccountDb {
  account: PrismaClient['account'];
}

/**
 * Residual 1159 keep-boundary: account profile/settings DTO → Prisma.InputJsonObject cast only.
 * Soft residual 1159: AI toPrismaJson deep-clones unknown → InputJsonValue (no force-merge).
 */
function toPrismaJson(value: AccountProfileDTO | AccountSettingsDTO): Prisma.InputJsonObject {
  return value as unknown as Prisma.InputJsonObject;
}

export class PrismaAccountRepository
  extends AggregateRepositoryBase<Account>
  implements IAccountRepository
{
  constructor(private readonly prisma: PrismaClient) {
    super(eventBusAdapter);
  }

  /**
   * Resolve the effective DB client (transactional or default).
   */
  private client(tx?: AccountDb): AccountDb {
    return tx ?? this.prisma;
  }

  /**
   * Protected persistence method - called by base class before event publishing
   */
  protected async persist(account: Account, tx?: AccountDb): Promise<void> {
    const db = this.client(tx);

    await db.account.upsert({
      where: { id: account.id.toString() },
      update: {
        status: account.status.toString(),
        emailAddress: account.email.address,
        emailIsVerified: account.email.isVerified,
        emailVerifiedAt: account.email.verifiedAt != null ? new Date(account.email.verifiedAt) : null,
        emailIsPrimary: account.email.isPrimary,
        phoneCountryCode: account.phone?.countryCode ?? null,
        phoneNumber: account.phone?.number ?? null,
        phoneFullNumber: account.phone?.fullNumber ?? null,
        phoneIsVerified: account.phone?.isVerified ?? null,
        phoneVerifiedAt: account.phone?.verifiedAt != null ? new Date(account.phone.verifiedAt) : null,
        profile: toPrismaJson(account.profile.toDTO()),
        settings: toPrismaJson(account.settings.toDTO()),
        version: account.version,
        updatedAt: new Date(account.updatedAt),
      },
      create: {
        id: account.id.toString(),
        status: account.status.toString(),
        emailAddress: account.email.address,
        emailIsVerified: account.email.isVerified,
        emailVerifiedAt: account.email.verifiedAt != null ? new Date(account.email.verifiedAt) : null,
        emailIsPrimary: account.email.isPrimary,
        phoneCountryCode: account.phone?.countryCode ?? null,
        phoneNumber: account.phone?.number ?? null,
        phoneFullNumber: account.phone?.fullNumber ?? null,
        phoneIsVerified: account.phone?.isVerified ?? null,
        phoneVerifiedAt: account.phone?.verifiedAt != null ? new Date(account.phone.verifiedAt) : null,
        profile: toPrismaJson(account.profile.toDTO()),
        settings: toPrismaJson(account.settings.toDTO()),
        version: account.version,
        createdAt: new Date(account.createdAt),
        updatedAt: new Date(account.updatedAt),
      },
    });
  }

  /**
   * save 方法由基类提供，支持事务参数
   */
  override async save(account: Account, tx?: AccountDb): Promise<void> {
    await this.persist(account, tx);
    await publishAggregateEvents(account, this.eventBus);
  }

  async findById(id: string, tx?: AccountDb): Promise<Account | null> {
    const row = await this.client(tx).account.findUnique({ where: { id } });
    if (!row) return null;
    return AccountPrismaMapper.toDomain(row);
  }

  async findByNickname(nickname: string, tx?: AccountDb): Promise<Account | null> {
    const rows = await this.client(tx).account.findMany({
      where: { profile: { path: ['nickname'], equals: nickname } },
      take: 1,
    });
    if (!rows || rows.length === 0) return null;
    return AccountPrismaMapper.toDomain(rows[0]);
  }

  async findByEmail(email: string, tx?: AccountDb): Promise<Account | null> {
    const row = await this.client(tx).account.findFirst({ where: { emailAddress: email } });
    if (!row) return null;
    return AccountPrismaMapper.toDomain(row);
  }


  async existsByNickname(nickname: string, tx?: AccountDb): Promise<boolean> {
    const account = await this.findByNickname(nickname, tx);
    return account !== null;
  }

  async existsByEmail(email: string, tx?: AccountDb): Promise<boolean> {
    const count = await this.client(tx).account.count({ where: { emailAddress: email } });
    return count > 0;
  }

  async delete(id: string, tx?: AccountDb): Promise<void> {
    await this.client(tx).account.delete({ where: { id } });
  }

  async findAll(
    options?: {
      page?: number;
      pageSize?: number;
      status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
    },
    tx?: AccountDb,
  ): Promise<{ accounts: Account[]; total: number }> {
    const db = this.client(tx);
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 10;
    const skip = (page - 1) * pageSize;
    const where = options?.status ? { status: options.status } : {};

    const [rows, total] = await Promise.all([
      db.account.findMany({ where, skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
      db.account.count({ where }),
    ]);

    const accounts = rows.map((row: PrismaAccount) => AccountPrismaMapper.toDomain(row));
    return { accounts, total };
  }
}
