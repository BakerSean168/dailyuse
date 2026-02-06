/**
 * Account Prisma Repository
 *
 * Prisma implementation of IAccountRepository.
 */
import { PrismaClient } from '../../../generated/prisma/client';
import type { IAccountRepository } from '@dailyuse/domain-server/account';
import { Account } from '@dailyuse/domain-server/account';
import { IdentityId } from '@dailyuse/domain-server/account';
import type { AccountPersistenceDTO } from '@dailyuse/contracts/account';

export class AccountPrismaRepository implements IAccountRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * 保存逻辑 (Upsert)
   */
  async save(account: Account): Promise<void> {
    // 1. Domain Entity -> Persistence DTO
    const raw = account.toPersistenceDTO();

    // 2. Persistence DTO -> Prisma Input
    // 注意：JSON 字段在 Prisma 里需要显式转换，或者如果类型兼容直接传
    await this.prisma.account.upsert({
      where: { id: raw.id },
      update: {
        status: raw.status,
        emailAddress: raw.email.address, // 提取 address 存入独立列
        emailIsVerified: raw.email.isVerified,
        emailVerifiedAt: raw.email.verifiedAt,
        emailIsPrimary: raw.email.isPrimary,
        phoneCountryCode: raw.phone?.countryCode ?? null,
        phoneNumber: raw.phone?.number ?? null,
        phoneFullNumber: raw.phone?.fullNumber ?? null,
        phoneIsVerified: raw.phone?.isVerified ?? null,
        phoneVerifiedAt: raw.phone?.verifiedAt ?? null,
        profile: raw.profile as any, // 强转为 Prisma Json
        settings: raw.settings as any,
        updatedAt: raw.updatedAt
      },
      create: {
        id: raw.id,
        status: raw.status,
        emailAddress: raw.email.address,
        emailIsVerified: raw.email.isVerified,
        emailVerifiedAt: raw.email.verifiedAt,
        emailIsPrimary: raw.email.isPrimary,
        phoneCountryCode: raw.phone?.countryCode ?? null,
        phoneNumber: raw.phone?.number ?? null,
        phoneFullNumber: raw.phone?.fullNumber ?? null,
        phoneIsVerified: raw.phone?.isVerified ?? null,
        phoneVerifiedAt: raw.phone?.verifiedAt ?? null,
        profile: raw.profile as any,
        settings: raw.settings as any,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt
      }
    });
  }
  
  /**
   * 查找逻辑
   */
  async findById(id: IdentityId): Promise<Account | null> {
    // 1. Prisma Query
    const row = await this.prisma.account.findUnique({
      where: { id: id } // IdentityId 是 string，可以直接传
    });

    if (!row) return null;

    // 2. Prisma Result -> Persistence DTO -> Domain Entity
    return this.mapToDomain(row);
  }

  async findByEmail(email: string): Promise<Account | null> {
    const row = await this.prisma.account.findFirst({
      where: { email: email }
    });

    if (!row) return null;

    return this.mapToDomain(row);
  }

  async findByPhone(phoneNumber: string): Promise<Account | null> {
    const row = await this.prisma.account.findFirst({
      where: { phoneNumber: phoneNumber }
    });

    if (!row) return null;

    return this.mapToDomain(row);
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.account.delete({ where: { uuid } });
  }

  async findAll(
    options?: {
      page?: number;
      pageSize?: number;
      status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
    },
  ): Promise<{ accounts: any[]; total: number }> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where = options?.status ? { status: options.status } : {};

    const [accounts, total] = await Promise.all([
      this.prisma.account.findMany({
        where,
        skip,
        take: pageSize,
      }),
      this.prisma.account.count({ where }),
    ]);

    return { accounts, total };
  }

  /**
   * 私有辅助方法：Mapper
   * 负责把 Prisma 返回的 Row 组装成 Domain 认可的 PersistenceDTO
   */
  private mapToDomain(row: any): Account {
    // 组装 PersistenceDTO
    // 注意：因为我们使用了 JSONB，数据库取出来的 profile/settings 已经是对象了
    // 只需要确保它符合 DTO 结构
    const persistenceDTO: AccountPersistenceDTO = {
      id: row.id,
      status: row.status as any, // 强转为 AccountStatus
      
      // 这里的 row.profile 已经是 JSON 对象了，不需要 JSON.parse
      profile: row.profile, 
      settings: row.settings,
      
      email: {
        address: row.email,
        isVerified: row.emailIsVerified,
        verifiedAt: row.emailVerifiedAt,
        isPrimary: row.emailIsPrimary
      },
      
      phone: row.phoneNumber ? {
        fullNumber: row.phoneFullNumber,
        countryCode: row.phoneCountryCode,
        number: row.phoneNumber,
        isVerified: row.phoneIsVerified
      } : null,

      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };

    return Account.fromPersistenceDTO(persistenceDTO);
  }
}

