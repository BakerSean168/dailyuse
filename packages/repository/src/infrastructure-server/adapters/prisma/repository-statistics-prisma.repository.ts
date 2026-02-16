import type { PrismaClient } from '../../../generated/prisma/client';
import type { IRepositoryStatisticsRepository } from '../../../domain-server/repositories/IRepositoryStatisticsRepository';

/**
 * Prisma implementation of IRepositoryStatisticsRepository (stub).
 * TODO: Implement actual statistics queries.
 */
export class RepositoryStatisticsPrismaRepository implements IRepositoryStatisticsRepository {
  constructor(private readonly prisma: PrismaClient) {}
}
