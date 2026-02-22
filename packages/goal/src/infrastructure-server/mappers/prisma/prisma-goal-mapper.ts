/**
 * Prisma Goal Mapper
 *
 * Maps between Goal domain aggregate (with relations) and Prisma model.
 * Handles the conversion of Prisma query results (including keyResults,
 * reviews, weightSnapshots) to GoalPersistenceDTO for domain reconstruction.
 */

import type {
  Goal as PrismaGoal,
  KeyResult as PrismaKeyResult,
  GoalReview as PrismaGoalReview,
  KeyResultWeightSnapshot as PrismaKeyResultWeightSnapshot,
} from '@dailyuse/database';
import type {
  GoalPersistenceDTO,
  KeyResultPersistenceDTO,
  GoalReviewPersistenceDTO,
  KeyResultWeightSnapshotDTO,
} from '@dailyuse/contracts/goal';

/**
 * Prisma Goal with eagerly loaded relations
 */
export type PrismaGoalWithRelations = PrismaGoal & {
  keyResults?: PrismaKeyResult[];
  reviews?: PrismaGoalReview[];
  keyResultWeightSnapshots?: PrismaKeyResultWeightSnapshot[];
};

/**
 * PrismaGoalMapper
 *
 * Static utility class for mapping between Prisma Goal models and domain DTOs.
 */
export class PrismaGoalMapper {
  /**
   * Map a Prisma Goal result (with includes) to GoalPersistenceDTO
   */
  static toDomainDTO(row: PrismaGoalWithRelations): GoalPersistenceDTO {
    return {
      id: row.id,
      identityId: row.identityId,
      name: row.name,
      description: row.description ?? null,
      color: row.color ?? '#3B82F6',
      feasibilityAnalysis: row.feasibilityAnalysis ?? null,
      motivation: row.motivation ?? null,
      status: row.status,
      importance: row.importance,
      priority: row.priority ?? 0,
      category: row.category ?? null,
      tags: row.tags ?? [],
      startDate: row.startDate ?? null,
      targetDate: row.targetDate ?? null,
      completedAt: row.completedAt ?? null,
      archivedAt: row.archivedAt ?? null,
      folderId: row.folderId ?? null,
      parentGoalId: row.parentGoalId ?? null,
      sortOrder: row.sortOrder ?? 0,
      reminderConfig: row.reminderConfig ? JSON.parse(row.reminderConfig) : null,
      keyResults: row.keyResults
        ? row.keyResults.map(PrismaGoalMapper.mapKeyResult)
        : null,
      goalReviews: row.reviews
        ? row.reviews.map(PrismaGoalMapper.mapGoalReview)
        : null,
      weightSnapshots: row.keyResultWeightSnapshots
        ? row.keyResultWeightSnapshots.map(PrismaGoalMapper.mapWeightSnapshot)
        : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt ?? null,
      version: row.version ?? 1,
    };
  }

  /**
   * Map a Prisma KeyResult row to KeyResultPersistenceDTO.
   * Prisma stores progress as individual columns; DTO stores as JSON string.
   */
  static mapKeyResult(row: PrismaKeyResult): KeyResultPersistenceDTO {
    const progress = JSON.stringify({
      initialValue: 0,
      currentValue: row.currentValue ?? 0,
      targetValue: row.targetValue ?? 100,
      valueType: row.valueType ?? 'Incremental',
      aggregationMethod: row.aggregationMethod ?? 'Last',
      unit: row.unit ?? null,
    });

    return {
      id: row.id,
      goalId: row.goalId,
      title: row.title,
      description: row.description ?? null,
      progress,
      weight: row.weight ?? 1,
      sortOrder: row.order ?? 0,
      version: row.version ?? 1,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt ?? null,
    };
  }

  /**
   * Map a Prisma GoalReview row to GoalReviewPersistenceDTO
   */
  static mapGoalReview(row: PrismaGoalReview): GoalReviewPersistenceDTO {
    return {
      id: row.id,
      goalId: row.goalId,
      type: row.reviewType,
      rating: row.rating ?? 3,
      summary: row.content,
      achievements: row.achievements ?? null,
      challenges: row.challenges ?? null,
      improvements: row.lessonsLearned ?? null,
      keyResultSnapshots: '[]',
      reviewedAt: row.createdAt,
      version: row.version ?? 1,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt ?? null,
    };
  }

  /**
   * Map a Prisma KeyResultWeightSnapshot row to DTO
   */
  static mapWeightSnapshot(row: PrismaKeyResultWeightSnapshot): KeyResultWeightSnapshotDTO {
    return {
      id: row.id,
      goalId: row.goalId,
      keyResultId: row.keyResultId,
      oldWeight: row.oldWeight,
      newWeight: row.newWeight,
      weightDelta: row.weightDelta,
      snapshotTime: row.snapshotTime,
      trigger: row.trigger as KeyResultWeightSnapshotDTO['trigger'],
      reason: row.reason ?? null,
      operatorId: row.operatorId,
      createdAt: row.createdAt,
    };
  }

  /**
   * Parse KeyResultPersistenceDTO.progress JSON → Prisma columns
   */
  static parseKeyResultProgress(kr: KeyResultPersistenceDTO) {
    const progress =
      typeof kr.progress === 'string' ? JSON.parse(kr.progress) : kr.progress;
    return {
      valueType: progress.valueType ?? 'Incremental',
      aggregationMethod: progress.aggregationMethod ?? 'Last',
      targetValue: progress.targetValue ?? 100,
      currentValue: progress.currentValue ?? 0,
      unit: progress.unit ?? null,
    };
  }
}
