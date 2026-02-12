/**
 * Goal Prisma Repository
 *
 * Prisma implementation of IGoalRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 *
 * Mapping:
 * - Domain Goal ↔ GoalPersistenceDTO ↔ Prisma result
 * - KeyResult progress is stored as individual columns in Prisma,
 *   but as a JSON string in the domain DTO
 * - GoalReview maps reviewType→type, content→summary, lessonsLearned→improvements
 */

import type { PrismaClient } from '@dailyuse/database';
import type { IGoalRepository } from '../../ports/goal-repository.port';
import { Goal } from '@/domain-server';
import type { GoalPersistenceDTO, KeyResultPersistenceDTO, GoalReviewPersistenceDTO, KeyResultWeightSnapshotDTO } from '@dailyuse/contracts/goal';

// ============================================================
// Prisma ↔ Domain Mappers
// ============================================================

/**
 * Map a Prisma Goal result (with includes) to GoalPersistenceDTO
 */
function mapPrismaToGoalDTO(row: any): GoalPersistenceDTO {
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
      ? row.keyResults.map(mapPrismaToKeyResultDTO)
      : null,
    goalReviews: row.reviews
      ? row.reviews.map(mapPrismaToGoalReviewDTO)
      : null,
    weightSnapshots: row.keyResultWeightSnapshots
      ? row.keyResultWeightSnapshots.map(mapPrismaToWeightSnapshotDTO)
      : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt ?? null,
    version: row.version ?? 1,
  };
}

/**
 * Map a Prisma KeyResult row to KeyResultPersistenceDTO
 * Prisma stores progress as individual columns; DTO stores as JSON string
 */
function mapPrismaToKeyResultDTO(row: any): KeyResultPersistenceDTO {
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
function mapPrismaToGoalReviewDTO(row: any): GoalReviewPersistenceDTO {
  return {
    id: row.id,
    goalId: row.goalId,
    type: row.reviewType,
    rating: row.rating ?? 3,
    summary: row.content,
    achievements: row.achievements ?? null,
    challenges: row.challenges ?? null,
    improvements: row.lessonsLearned ?? null,
    keyResultSnapshots: '[]', // Not stored in Prisma — reconstructed at review time
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
function mapPrismaToWeightSnapshotDTO(row: any): KeyResultWeightSnapshotDTO {
  return {
    id: row.id,
    goalId: row.goalId,
    keyResultId: row.keyResultId,
    oldWeight: row.oldWeight,
    newWeight: row.newWeight,
    weightDelta: row.weightDelta,
    snapshotTime: row.snapshotTime,
    trigger: row.trigger as any,
    reason: row.reason ?? null,
    operatorId: row.operatorId,
    createdAt: row.createdAt,
  };
}

/**
 * Parse KeyResultPersistenceDTO.progress JSON → Prisma columns
 */
function parseKeyResultProgressForPrisma(kr: KeyResultPersistenceDTO) {
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

// Include preset for Prisma queries
const GOAL_INCLUDE_ALL = {
  keyResults: { orderBy: { order: 'asc' as const } },
  reviews: { orderBy: { createdAt: 'desc' as const } },
  keyResultWeightSnapshots: { orderBy: { snapshotTime: 'desc' as const } },
};

const GOAL_INCLUDE_KEY_RESULTS = {
  keyResults: { orderBy: { order: 'asc' as const } },
};

/**
 * Goal Prisma Repository
 */
export class GoalPrismaRepository implements IGoalRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ================= Read Operations =================

  async findById(
    id: string,
    options?: { includeChildren?: boolean },
  ): Promise<Goal | null> {
    const row = await (this.prisma as any).goal.findUnique({
      where: { id },
      include: options?.includeChildren ? GOAL_INCLUDE_ALL : undefined,
    });
    if (!row) return null;

    const dto = mapPrismaToGoalDTO(row);
    return Goal.fromPersistenceDTO(dto);
  }

  async findByAccountUuid(
    accountUuid: string,
    options?: {
      includeChildren?: boolean;
      status?: string;
      folderUuid?: string;
    },
  ): Promise<Goal[]> {
    const rows = await (this.prisma as any).goal.findMany({
      where: {
        identityId: accountUuid,
        deletedAt: null,
        ...(options?.status && { status: options.status }),
        ...(options?.folderUuid && { folderId: options.folderUuid }),
      },
      include: options?.includeChildren ? GOAL_INCLUDE_ALL : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row: any) => Goal.fromPersistenceDTO(mapPrismaToGoalDTO(row)));
  }

  async findByFolderUuid(folderUuid: string): Promise<Goal[]> {
    const rows = await (this.prisma as any).goal.findMany({
      where: { folderId: folderUuid, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row: any) => Goal.fromPersistenceDTO(mapPrismaToGoalDTO(row)));
  }

  // ================= Write Operations =================

  async save(goal: Goal): Promise<void> {
    const dto = goal.toPersistenceDTO();

    // Run in a transaction for consistency
    await (this.prisma as any).$transaction(async (tx: any) => {
      // 1. Upsert the Goal root
      await tx.goal.upsert({
        where: { id: dto.id as string },
        create: {
          id: dto.id as string,
          identityId: dto.identityId as string,
          name: dto.name,
          description: dto.description,
          color: dto.color,
          feasibilityAnalysis: dto.feasibilityAnalysis,
          motivation: dto.motivation,
          status: dto.status,
          importance: dto.importance,
          priority: dto.priority,
          category: dto.category,
          tags: dto.tags,
          startDate: dto.startDate ? new Date(dto.startDate as any) : null,
          targetDate: dto.targetDate ? new Date(dto.targetDate as any) : null,
          completedAt: dto.completedAt ? new Date(dto.completedAt as any) : null,
          archivedAt: dto.archivedAt ? new Date(dto.archivedAt as any) : null,
          folderId: dto.folderId ? (dto.folderId as string) : null,
          parentGoalId: dto.parentGoalId ? (dto.parentGoalId as string) : null,
          sortOrder: dto.sortOrder,
          reminderConfig: dto.reminderConfig ? JSON.stringify(dto.reminderConfig) : null,
          version: dto.version,
          deletedAt: dto.deletedAt ? new Date(dto.deletedAt as any) : null,
        },
        update: {
          name: dto.name,
          description: dto.description,
          color: dto.color,
          feasibilityAnalysis: dto.feasibilityAnalysis,
          motivation: dto.motivation,
          status: dto.status,
          importance: dto.importance,
          priority: dto.priority,
          category: dto.category,
          tags: dto.tags,
          startDate: dto.startDate ? new Date(dto.startDate as any) : null,
          targetDate: dto.targetDate ? new Date(dto.targetDate as any) : null,
          completedAt: dto.completedAt ? new Date(dto.completedAt as any) : null,
          archivedAt: dto.archivedAt ? new Date(dto.archivedAt as any) : null,
          folderId: dto.folderId ? (dto.folderId as string) : null,
          parentGoalId: dto.parentGoalId ? (dto.parentGoalId as string) : null,
          sortOrder: dto.sortOrder,
          reminderConfig: dto.reminderConfig ? JSON.stringify(dto.reminderConfig) : null,
          version: dto.version,
          deletedAt: dto.deletedAt ? new Date(dto.deletedAt as any) : null,
          updatedAt: new Date(),
        },
      });

      // 2. Sync KeyResults: upsert current, delete removed
      if (dto.keyResults) {
        const currentKrIds = dto.keyResults.map((kr) => kr.id as string);

        // Delete KeyResults that no longer exist in the aggregate
        await tx.keyResult.deleteMany({
          where: {
            goalId: dto.id as string,
            id: { notIn: currentKrIds },
          },
        });

        // Upsert each KeyResult
        for (const kr of dto.keyResults) {
          const progress = parseKeyResultProgressForPrisma(kr);
          await tx.keyResult.upsert({
            where: { id: kr.id as string },
            create: {
              id: kr.id as string,
              goalId: dto.id as string,
              title: kr.title,
              description: kr.description,
              valueType: progress.valueType,
              aggregationMethod: progress.aggregationMethod,
              targetValue: progress.targetValue,
              currentValue: progress.currentValue,
              unit: progress.unit,
              weight: kr.weight,
              order: kr.sortOrder,
              version: kr.version,
            },
            update: {
              title: kr.title,
              description: kr.description,
              valueType: progress.valueType,
              aggregationMethod: progress.aggregationMethod,
              targetValue: progress.targetValue,
              currentValue: progress.currentValue,
              unit: progress.unit,
              weight: kr.weight,
              order: kr.sortOrder,
              version: kr.version,
              updatedAt: new Date(),
            },
          });
        }
      }

      // 3. Sync GoalReviews: upsert current, delete removed
      if (dto.goalReviews) {
        const currentReviewIds = dto.goalReviews.map((r) => r.id as string);

        await tx.goalReview.deleteMany({
          where: {
            goalId: dto.id as string,
            id: { notIn: currentReviewIds },
          },
        });

        for (const review of dto.goalReviews) {
          await tx.goalReview.upsert({
            where: { id: review.id as string },
            create: {
              id: review.id as string,
              goalId: dto.id as string,
              reviewType: review.type,
              content: review.summary,
              achievements: review.achievements,
              challenges: review.challenges,
              lessonsLearned: review.improvements,
              nextSteps: null,
              rating: review.rating,
              version: review.version,
            },
            update: {
              reviewType: review.type,
              content: review.summary,
              achievements: review.achievements,
              challenges: review.challenges,
              lessonsLearned: review.improvements,
              rating: review.rating,
              version: review.version,
              updatedAt: new Date(),
            },
          });
        }
      }

      // 4. Sync Weight Snapshots (insert-only — snapshots are immutable)
      if (dto.weightSnapshots && dto.weightSnapshots.length > 0) {
        for (const ws of dto.weightSnapshots) {
          // Check if snapshot already exists (idempotent)
          const exists = await tx.keyResultWeightSnapshot.findUnique({
            where: { id: ws.id as string },
          });
          if (!exists) {
            await tx.keyResultWeightSnapshot.create({
              data: {
                id: ws.id as string,
                goalId: dto.id as string,
                keyResultId: ws.keyResultId as string,
                oldWeight: ws.oldWeight,
                newWeight: ws.newWeight,
                weightDelta: ws.weightDelta,
                snapshotTime: new Date(ws.snapshotTime as any),
                trigger: ws.trigger,
                reason: ws.reason ?? null,
                operatorId: ws.operatorId as string,
              },
            });
          }
        }
      }
    });
  }

  // ================= Delete Operations =================

  async delete(id: string): Promise<void> {
    await (this.prisma as any).goal.delete({ where: { id } });
  }

  async softDelete(id: string): Promise<void> {
    await (this.prisma as any).goal.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ================= Utility Operations =================

  async exists(id: string): Promise<boolean> {
    const count = await (this.prisma as any).goal.count({ where: { id } });
    return count > 0;
  }

  async batchUpdateStatus(ids: string[], status: string): Promise<void> {
    await (this.prisma as any).goal.updateMany({
      where: { id: { in: ids } },
      data: { status, updatedAt: new Date() },
    });
  }

  async batchMoveToFolder(ids: string[], folderId: string | null): Promise<void> {
    await (this.prisma as any).goal.updateMany({
      where: { id: { in: ids } },
      data: { folderId, updatedAt: new Date() },
    });
  }

  // ================= Hierarchy Operations =================

  async isAncestor(
    potentialAncestorId: string,
    potentialDescendantId: string,
  ): Promise<boolean> {
    let currentId: string | null = potentialDescendantId;
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === potentialAncestorId) return true;
      if (visited.has(currentId)) break; // Circular reference guard
      visited.add(currentId);

      const parent: { parentGoalId: string | null } | null = await (this.prisma as any).goal.findUnique({
        where: { id: currentId },
        select: { parentGoalId: true },
      });
      currentId = parent?.parentGoalId ?? null;
    }
    return false;
  }

  async findChildren(parentId: string): Promise<Goal[]> {
    const rows = await (this.prisma as any).goal.findMany({
      where: { parentGoalId: parentId, deletedAt: null },
      include: GOAL_INCLUDE_ALL,
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((row: any) => Goal.fromPersistenceDTO(mapPrismaToGoalDTO(row)));
  }
}
