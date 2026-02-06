// @ts-nocheck
import type {  PrismaClient  } from "../../../generated/prisma/client";
import type { IGoalStatisticsRepository } from '@dailyuse/domain-server/goal';
import { GoalStatistics } from '@dailyuse/domain-server/goal';

/**
 * GoalStatistics Prisma Repository瀹炵幇
 * 璐熻矗缁熻鏁版嵁鐨勬寔涔呭寲
 *
 * 娉ㄦ剰锛?
 * - GoalStatistics 浣跨敤 UPSERT 璇箟锛坅ccountUuid 鍞竴锛?
 * - 姣忎釜璐︽埛鍙湁涓€鏉＄粺璁¤褰?
 */
export class PrismaGoalStatisticsRepository implements IGoalStatisticsRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Save缁熻淇℃伅锛圲PSERT 璇箟锛?
   *
   * 杩斿洖Update鍚庣殑缁熻鑱氬悎鏍?
   */
  async upsert(statistics: GoalStatistics): Promise<GoalStatistics> {
    const persistence = statistics.toPersistenceDTO();

    const record = await this.prisma.goalStatistic.upsert({
      where: { accountUuid: persistence.accountUuid },
      create: {
        accountUuid: persistence.accountUuid,
        totalGoals: persistence.totalGoals,
        activeGoals: persistence.activeGoals,
        completedGoals: persistence.completedGoals,
        archivedGoals: persistence.archivedGoals,
        overdueGoals: persistence.overdueGoals,
        totalKeyResults: persistence.totalKeyResults,
        completedKeyResults: persistence.completedKeyResults,
        averageProgress: persistence.averageProgress,
        goalsByImportance: persistence.goalsByImportance,
        goalsByCategory: persistence.goalsByCategory,
        goalsByStatus: persistence.goalsByStatus,
        goalsCreatedThisWeek: persistence.goalsCreatedThisWeek,
        goalsCompletedThisWeek: persistence.goalsCompletedThisWeek,
        goalsCreatedThisMonth: persistence.goalsCreatedThisMonth,
        goalsCompletedThisMonth: persistence.goalsCompletedThisMonth,
        totalReviews: persistence.totalReviews,
        averageRating: persistence.averageRating,
        totalFocusSessions: 0,
        completedFocusSessions: 0,
        totalFocusMinutes: 0,
        lastCalculatedAt: new Date(persistence.lastCalculatedAt),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      update: {
        totalGoals: persistence.totalGoals,
        activeGoals: persistence.activeGoals,
        completedGoals: persistence.completedGoals,
        archivedGoals: persistence.archivedGoals,
        overdueGoals: persistence.overdueGoals,
        totalKeyResults: persistence.totalKeyResults,
        completedKeyResults: persistence.completedKeyResults,
        averageProgress: persistence.averageProgress,
        goalsByImportance: persistence.goalsByImportance,
        goalsByCategory: persistence.goalsByCategory,
        goalsByStatus: persistence.goalsByStatus,
        goalsCreatedThisWeek: persistence.goalsCreatedThisWeek,
        goalsCompletedThisWeek: persistence.goalsCompletedThisWeek,
        goalsCreatedThisMonth: persistence.goalsCreatedThisMonth,
        goalsCompletedThisMonth: persistence.goalsCompletedThisMonth,
        totalReviews: persistence.totalReviews,
        averageRating: persistence.averageRating,
        lastCalculatedAt: new Date(persistence.lastCalculatedAt),
        updatedAt: new Date(),
        // createdAt 涓嶆洿鏂?
      },
    });

    // 杩斿洖Update鍚庣殑鑱氬悎鏍?
    return GoalStatistics.fromPersistenceDTO({
      accountUuid: record.accountUuid,
      totalGoals: record.totalGoals,
      activeGoals: record.activeGoals,
      completedGoals: record.completedGoals,
      archivedGoals: record.archivedGoals,
      overdueGoals: record.overdueGoals,
      totalKeyResults: record.totalKeyResults,
      completedKeyResults: record.completedKeyResults,
      averageProgress: record.averageProgress,
      goalsByImportance: record.goalsByImportance,
      goalsByCategory: record.goalsByCategory,
      goalsByStatus: record.goalsByStatus,
      goalsCreatedThisWeek: record.goalsCreatedThisWeek,
      goalsCompletedThisWeek: record.goalsCompletedThisWeek,
      goalsCreatedThisMonth: record.goalsCreatedThisMonth,
      goalsCompletedThisMonth: record.goalsCompletedThisMonth,
      totalReviews: record.totalReviews,
      averageRating: record.averageRating,
      lastCalculatedAt: record.lastCalculatedAt.getTime(),
    });
  }

  /**
   * 閫氳繃璐︽埛 UUID 鏌ユ壘缁熻
   */
  async findByAccountUuid(accountUuid: string): Promise<GoalStatistics | null> {
    const record = await this.prisma.goalStatistic.findUnique({
      where: { accountUuid },
    });

    if (!record) {
      return null;
    }

    return GoalStatistics.fromPersistenceDTO({
      accountUuid: record.accountUuid,
      totalGoals: record.totalGoals,
      activeGoals: record.activeGoals,
      completedGoals: record.completedGoals,
      archivedGoals: record.archivedGoals,
      overdueGoals: record.overdueGoals,
      totalKeyResults: record.totalKeyResults,
      completedKeyResults: record.completedKeyResults,
      averageProgress: record.averageProgress,
      goalsByImportance: record.goalsByImportance,
      goalsByCategory: record.goalsByCategory,
      goalsByStatus: record.goalsByStatus,
      goalsCreatedThisWeek: record.goalsCreatedThisWeek,
      goalsCompletedThisWeek: record.goalsCompletedThisWeek,
      goalsCreatedThisMonth: record.goalsCreatedThisMonth,
      goalsCompletedThisMonth: record.goalsCompletedThisMonth,
      totalReviews: record.totalReviews,
      averageRating: record.averageRating,
      lastCalculatedAt: record.lastCalculatedAt.getTime(),
    });
  }

  /**
   * Delete缁熻
   */
  async delete(accountUuid: string): Promise<boolean> {
    try {
      await this.prisma.goalStatistic.delete({
        where: { accountUuid },
      });
      return true;
    } catch (error) {
      // 濡傛灉Record涓嶅瓨鍦紝Prisma浼氭姏鍑洪敊璇?
      return false;
    }
  }

  /**
   * 妫€鏌ョ粺璁℃槸鍚﹀瓨鍦?
   */
  async exists(accountUuid: string): Promise<boolean> {
    const count = await this.prisma.goalStatistic.count({
      where: { accountUuid },
    });
    return count > 0;
  }
}
