/**
 * Account Prisma Repository
 *
 * Prisma implementation of IAccountRepository.
 */

import type { IAccountRepository } from '@dailyuse/domain-server/account';

export class AccountPrismaRepository implements IAccountRepository {
  constructor(private readonly prisma: any) {}

  async findById(uuid: string): Promise<any | null> {
    return this.prisma.account.findUnique({ where: { uuid } });
  }

  async findByEmail(email: string): Promise<any | null> {
    return this.prisma.account.findUnique({ where: { email } });
  }

  async findByUsername(username: string): Promise<any | null> {
    return this.prisma.account.findUnique({ where: { username } });
  }

  async findByPhone(phoneNumber: string): Promise<any | null> {
    return this.prisma.account.findUnique({ where: { phoneNumber } });
  }

  async existsByUsername(username: string): Promise<boolean> {
    const account = await this.prisma.account.findUnique({ where: { username } });
    return !!account;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const account = await this.prisma.account.findUnique({ where: { email } });
    return !!account;
  }

  async save(account: any): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
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
}

