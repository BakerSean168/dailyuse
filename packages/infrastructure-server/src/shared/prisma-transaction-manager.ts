import { ITransactionManager } from '@dailyuse/application-server/common/transaction.manager';
import { prisma } from './config/prisma';

export class PrismaTransactionManager implements ITransactionManager {
  constructor(private readonly prismaClient: any) {}

  async transaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return this.prismaClient.$transaction(fn);
  }
}
