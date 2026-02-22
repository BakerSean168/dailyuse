/**
 * PrismaAccountRepository
 *
 * Prisma implementation of IAccountRepository.
 * Receives PrismaClient via constructor injection from @dailyuse/database.
 * 
 * Extends AggregateRepositoryBase to automatically publish domain events after persistence.
 */

import type { PrismaClient, Account as PrismaAccount } from '@dailyuse/database';
import type { IAccountRepository } from '../../../domain-server';
import { Account } from '../../../domain-server';
import type { AccountState } from '../../../domain-server';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import {
  AccountProfile,
  AccountSettings,
  ContactEmail,
  AccountStatus,
  ContactPhone,
} from '../../../domain-shared';
import { AggregateRepositoryBase, createEventBusAdapter } from '@dailyuse/patterns';
import { createLogger, eventBus } from '@dailyuse/utils';

const logger = createLogger('PrismaAccountRepository');
const eventBusAdapter = createEventBusAdapter(eventBus);

export class PrismaAccountRepository
  extends AggregateRepositoryBase<Account>
  implements IAccountRepository
{
  constructor(private readonly prisma: PrismaClient) {
    super(eventBusAdapter);
  }

  /**
   * Protected persistence method - called by base class before event publishing
   */
  protected async persist(account: Account, tx?: unknown): Promise<void> {
    const client = (tx || this.prisma) as PrismaClient;

    await (client as any).account.upsert({
      where: { id: account.id.toString() },
      update: {
        status: account.status.toString(),
        emailAddress: account.email.address,
        emailIsVerified: account.email.isVerified,
        emailVerifiedAt: account.email.toPersistenceDTO().verifiedAt,
        emailIsPrimary: account.email.isPrimary,
        phoneCountryCode: account.phone?.countryCode ?? null,
        phoneNumber: account.phone?.number ?? null,
        phoneFullNumber: account.phone?.fullNumber ?? null,
        phoneIsVerified: account.phone?.isVerified ?? null,
        phoneVerifiedAt: account.phone?.toPersistenceDTO().verifiedAt ?? null,
        profile: account.profile.toPersistenceDTO() as any,
        settings: account.settings.toPersistenceDTO() as any,
        version: account.version,
        updatedAt: account.updatedAt,
      },
      create: {
        id: account.id.toString(),
        status: account.status.toString(),
        emailAddress: account.email.address,
        emailIsVerified: account.email.isVerified,
        emailVerifiedAt: account.email.toPersistenceDTO().verifiedAt,
        emailIsPrimary: account.email.isPrimary,
        phoneCountryCode: account.phone?.countryCode ?? null,
        phoneNumber: account.phone?.number ?? null,
        phoneFullNumber: account.phone?.fullNumber ?? null,
        phoneIsVerified: account.phone?.isVerified ?? null,
        phoneVerifiedAt: account.phone?.toPersistenceDTO().verifiedAt ?? null,
        profile: account.profile.toPersistenceDTO() as any,
        settings: account.settings.toPersistenceDTO() as any,
        version: account.version,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      },
    });
  }

  /**
   * save 方法由基类提供，支持事务参数
   */
  override async save(account: Account, tx?: unknown): Promise<void> {
    await this.persist(account, tx);
    await this['publishDomainEvents'](account);
  }

  async findById(id: string, tx?: unknown): Promise<Account | null> {
    const client = (tx || this.prisma) as any;
    const row = await client.account.findUnique({ where: { id } });
    if (!row) return null;
    return this.mapToDomain(row);
  }

  async findByUsername(username: string, tx?: unknown): Promise<Account | null> {
    const client = (tx || this.prisma) as any;
    // Nickname stored in profile JSON �?search by nickname
    const rows = await client.account.findMany({
      where: { profile: { path: ['nickname'], equals: username } },
      take: 1,
    });
    if (!rows || rows.length === 0) return null;
    return this.mapToDomain(rows[0]);
  }

  async findByEmail(email: string, tx?: unknown): Promise<Account | null> {
    const client = (tx || this.prisma) as any;
    const row = await client.account.findFirst({ where: { emailAddress: email } });
    if (!row) return null;
    return this.mapToDomain(row);
  }

  async findByPhone(phoneNumber: string, tx?: unknown): Promise<Account | null> {
    const client = (tx || this.prisma) as any;
    const row = await client.account.findFirst({ where: { phoneNumber } });
    if (!row) return null;
    return this.mapToDomain(row);
  }

  async existsByUsername(username: string, tx?: unknown): Promise<boolean> {
    const account = await this.findByUsername(username, tx);
    return account !== null;
  }

  async existsByEmail(email: string, tx?: unknown): Promise<boolean> {
    const client = (tx || this.prisma) as any;
    const count = await client.account.count({ where: { emailAddress: email } });
    return count > 0;
  }

  async delete(id: string, tx?: unknown): Promise<void> {
    const client = (tx || this.prisma) as any;
    await client.account.delete({ where: { id } });
  }

  async findAll(
    options?: {
      page?: number;
      pageSize?: number;
      status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
    },
    tx?: unknown,
  ): Promise<{ accounts: Account[]; total: number }> {
    const client = (tx || this.prisma) as any;
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 10;
    const skip = (page - 1) * pageSize;
    const where = options?.status ? { status: options.status } : {};

    const [rows, total] = await Promise.all([
      client.account.findMany({ where, skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
      client.account.count({ where }),
    ]);

    const accounts = rows.map((row: PrismaAccount) => this.mapToDomain(row));
    return { accounts, total };
  }

  private mapToDomain(row: PrismaAccount): Account {
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
