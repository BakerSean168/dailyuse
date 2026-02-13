/**
 * GoalStatistics Prisma Repository
 *
 * Implements IGoalStatisticsRepository using Prisma.
 * Bridges the gap between GoalStatisticsPersistenceDTO (domain) and
 * the GoalStatistic Prisma model which has a reduced field set.
 *
 * Fields in domain DTO but NOT in Prisma: overdueGoals, averageProgress,
 * goalsByImportance, goalsByCategory, goalsByStatus, goalsCreatedThisWeek,
 * goalsCompletedThisWeek, goalsCreatedThisMonth, goalsCompletedThisMonth.
 * These are defaulted to 0/{} on read.
 *
 * Fields in Prisma but NOT in domain DTO: id, totalFocusSessions, totalFocusMinutes.
 * These are stored but not exposed to domain.
 */

import type { PrismaClient } from '@dailyuse/database';
import type { IGoalStatisticsRepository } from '@/domain-server';
import { GoalStatistics } from '@/domain-server';
import type { GoalStatisticsPersistenceDTO } from '@/domain-server';

export class GoalStatisticsPrismaRepository implements IGoalStatisticsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Map Prisma row to domain aggregate.
   * Provides defaults for fields not in the Prisma model.
   */
  private mapToEntity(data: any): GoalStatistics {
    const dto: GoalStatisticsPersistenceDTO = {
      identityId: data.identityId,
      totalGoals: data.totalGoals ?? 0,
      activeGoals: data.activeGoals ?? 0,
      completedGoals: data.completedGoals ?? 0,
      archivedGoals: data.archivedGoals ?? 0,
      overdueGoals: 0,
      totalKeyResults: data.totalKeyResults ?? 0,
      completedKeyResults: data.completedKeyResults ?? 0,
      averageProgress: 0,
      goalsByImportance: {},
      goalsByCategory: {},
      goalsByStatus: {},
      goalsCreatedThisWeek: 0,
      goalsCompletedThisWeek: 0,
      goalsCreatedThisMonth: 0,
      goalsCompletedThisMonth: 0,
      totalReviews: data.totalReviews ?? 0,
      averageRating: data.averageRating ?? 0,
      lastCalculatedAt: data.calculatedAt
        ? (data.calculatedAt as Date).getTime()
        : Date.now(),
    };
    return GoalStatistics.fromPersistenceDTO(dto);
  }

  /**
   * Upsert statistics. Uses identityId as the unique key.
   */
  async upsert(statistics: GoalStatistics): Promise<GoalStatistics> {
    const dto = statistics.toPersistenceDTO();
    const identityId = dto.identityId;
    const calculatedAt = new Date(dto.lastCalculatedAt);

    const data = await (this.prisma as any).goalStatistic.upsert({
      where: { identityId },
      create: {
        id: identityId,
        identityId,
        totalGoals: dto.totalGoals,
        activeGoals: dto.activeGoals,
        completedGoals: dto.completedGoals,
        archivedGoals: dto.archivedGoals,
        totalKeyResults: dto.totalKeyResults,
        completedKeyResults: dto.completedKeyResults,
        totalReviews: dto.totalReviews,
        averageRating: dto.averageRating,
        calculatedAt,
      },
      update: {
        totalGoals: dto.totalGoals,
        activeGoals: dto.activeGoals,
        completedGoals: dto.completedGoals,
        archivedGoals: dto.archivedGoals,
        totalKeyResults: dto.totalKeyResults,
        completedKeyResults: dto.completedKeyResults,
        totalReviews: dto.totalReviews,
        averageRating: dto.averageRating,
        calculatedAt,
      },
    });

    return this.mapToEntity(data);
  }

  /**
   * Find statistics by identity ID
   */
  async findByIdentityId(identityId: string): Promise<GoalStatistics | null> {
    const data = await (this.prisma as any).goalStatistic.findUnique({
      where: { identityId },
    });
    return data ? this.mapToEntity(data) : null;
  }

  /**
   * Delete statistics by identity ID
   */
  async delete(identityId: string): Promise<boolean> {
    try {
      await (this.prisma as any).goalStatistic.delete({
        where: { identityId },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if statistics exist for an identity
   */
  async exists(identityId: string): Promise<boolean> {
    const count = await (this.prisma as any).goalStatistic.count({
      where: { identityId },
    });
    return count > 0;
  }
}