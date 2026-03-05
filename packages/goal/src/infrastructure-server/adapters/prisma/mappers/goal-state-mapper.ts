/**
 * Goal State Mapper
 *
 * Converts GoalPersistenceDTO �?GoalState for domain reconstruction.
 * Shared by Prisma and SQLite mappers.
 */

import type { GoalPersistenceDTO, ReviewType } from '@dailyuse/contracts/goal';
import { GoalStatus } from '@dailyuse/contracts/goal';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { IdentityId } from '@dailyuse/domain-shared';
import { GoalId, GoalFolderId, GoalReviewId, KeyResultId } from '@/domain-shared';
import { KeyResult, GoalReview, GoalReminderConfig, KeyResultWeightSnapshot } from '@/domain-server';
import type { GoalState } from '@/domain-server';

/**
 * Convert a GoalPersistenceDTO to GoalState for Goal.load()
 */
export function persistenceDtoToGoalState(dto: GoalPersistenceDTO): GoalState {
  const tags = typeof dto.tags === 'string' ? JSON.parse(dto.tags) : dto.tags;
  const reminderConfig = dto.reminderConfig
    ? GoalReminderConfig.fromPersistenceDTO(
        typeof dto.reminderConfig === 'string'
          ? JSON.parse(dto.reminderConfig)
          : dto.reminderConfig,
      )
    : null;

  const keyResults = (dto.keyResults || []).map((kr) => {
    const progress =
      typeof kr.progress === 'string' ? JSON.parse(kr.progress) : kr.progress;
    return KeyResult.load({
      id: KeyResultId.of(kr.id),
      title: kr.title,
      description: kr.description ?? null,
      progress: {
        initialValue: progress.initialValue ?? 0,
        currentValue: progress.currentValue ?? 0,
        targetValue: progress.targetValue ?? 100,
        valueType: progress.valueType ?? 'Incremental',
        aggregationMethod: progress.aggregationMethod ?? 'Last',
        unit: progress.unit ?? null,
      },
      weight: kr.weight,
      sortOrder: kr.sortOrder,
      version: kr.version ?? 1,
      createdAt: new Date(kr.createdAt),
      updatedAt: new Date(kr.updatedAt),
      deletedAt: kr.deletedAt ? new Date(kr.deletedAt) : null,
    });
  });

  const goalReviews = (dto.goalReviews || []).map((r) => {
    const keyResultSnapshots =
      typeof r.keyResultSnapshots === 'string'
        ? JSON.parse(r.keyResultSnapshots)
        : r.keyResultSnapshots ?? [];
    return GoalReview.load({
      id: GoalReviewId.of(r.id),
      goalId: GoalId.of(r.goalId),
      type: r.type as ReviewType,
      rating: r.rating,
      summary: r.summary,
      achievements: r.achievements ?? null,
      challenges: r.challenges ?? null,
      improvements: r.improvements ?? null,
      keyResultSnapshots,
      reviewedAt: new Date(r.reviewedAt),
      version: r.version ?? 1,
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.updatedAt),
      deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
    });
  });

  const weightSnapshots = (dto.weightSnapshots || []).map((ws) =>
    KeyResultWeightSnapshot.fromDTO(ws),
  );

  return {
    id: GoalId.of(dto.id),
    identityId: IdentityId.of(dto.identityId),
    name: dto.name,
    description: dto.description ?? null,
    color: dto.color,
    feasibilityAnalysis: dto.feasibilityAnalysis ?? null,
    motivation: dto.motivation ?? null,
    status: dto.status as GoalStatus,
    importance: dto.importance as ImportanceLevel,
    priority: dto.priority ?? 0,
    category: dto.category ?? null,
    tags: Array.isArray(tags) ? tags : [],
    startDate: dto.startDate ? new Date(dto.startDate) : null,
    targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
    completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
    archivedAt: dto.archivedAt ? new Date(dto.archivedAt) : null,
    folderId: dto.folderId ? GoalFolderId.of(dto.folderId) : null,
    parentGoalId: dto.parentGoalId ? GoalId.of(dto.parentGoalId) : null,
    sortOrder: dto.sortOrder,
    reminderConfig,
    version: dto.version ?? 1,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    keyResults,
    goalReviews,
    weightSnapshots,
    totalKeyResults: dto.totalKeyResults,
    completedKeyResults: dto.completedKeyResults,
  };
}
