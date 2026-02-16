import type { PrismaClient } from '../../../generated/prisma/client';
import type { IScheduleStatisticsRepository } from '../../../domain-server/repositories/IScheduleStatisticsRepository';

/**
 * Prisma implementation of IScheduleStatisticsRepository (stub).
 * TODO: Implement actual statistics queries.
 */
export class ScheduleStatisticsPrismaRepository implements IScheduleStatisticsRepository {
  constructor(private readonly prisma: PrismaClient) {}
}
