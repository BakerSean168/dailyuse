/**
 * Goal Prisma Repository
 *
 * Prisma implementation of IGoalRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 *
 * Mapping:
 * - Domain Goal â†?GoalPersistenceDTO â†?Prisma result
 * - KeyResult progress is stored as individual columns in Prisma,
 *   but as a JSON string in the domain DTO
 * - GoalReview maps reviewTypeâ†’type, contentâ†’summary, lessonsLearnedâ†’improvements
 */

import type {
  PrismaClient,
  Prisma,
} from '@dailyuse/database';
import type { IGoalRepository } from '@/domain-server';
import { Goal } from '@/domain-server';
import type { KeyResultPersistenceDTO, GoalServerDTO, KeyResultServerDTO } from '@dailyuse/contracts/goal';
import { AggregateRepositoryBase, createEventBusAdapter } from '@dailyuse/patterns';
import { eventBus } from '@dailyuse/utils';
import { PrismaGoalMapper, type PrismaGoalWithRelations } from './mappers/prisma-goal-mapper';
import { persistenceDtoToGoalState } from './mappers/goal-state-mapper';

const eventBusAdapter = createEventBusAdapter(eventBus);

// ============================================================
// Prisma â†?Domain Mappers (delegated to PrismaGoalMapper)
// ============================================================

/**
 * Parse KeyResultPersistenceDTO.progress JSON â†?Prisma columns
 */
function parseKeyResultProgressForPrisma(kr: KeyResultPersistenceDTO | KeyResultServerDTO) {
  return PrismaGoalMapper.parseKeyResultProgress(kr as KeyResultPersistenceDTO);
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
export class GoalPrismaRepository
  extends AggregateRepositoryBase<Goal>
  implements IGoalRepository
{
  constructor(private readonly prisma: PrismaClient) {
    super(eventBusAdapter);
  }

  // ================= Read Operations =================

  async findById(
    id: string,
    options?: { includeChildren?: boolean },
  ): Promise<Goal | null> {
    const row = await this.prisma.goal.findUnique({
      where: { id },
      include: options?.includeChildren ? GOAL_INCLUDE_ALL : undefined,
    });
    if (!row) return null;

    const dto = PrismaGoalMapper.toDomainDTO(row);
    return Goal.load(persistenceDtoToGoalState(dto));
  }

  async findByIdentityId(
    identityId: string,
    options?: {
      includeChildren?: boolean;
      status?: string;
      folderId?: string;
    },
  ): Promise<Goal[]> {
    const rows = await this.prisma.goal.findMany({
      where: {
        identityId,
        deletedAt: null,
        ...(options?.status && { status: options.status }),
        ...(options?.folderId && { folderId: options.folderId }),
      },
      include: options?.includeChildren ? GOAL_INCLUDE_ALL : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row: PrismaGoalWithRelations) => Goal.load(persistenceDtoToGoalState(PrismaGoalMapper.toDomainDTO(row))));
  }

  async findByFolderId(folderId: string): Promise<Goal[]> {
    const rows = await this.prisma.goal.findMany({
      where: { folderId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row: PrismaGoalWithRelations) => Goal.load(persistenceDtoToGoalState(PrismaGoalMapper.toDomainDTO(row))));
  }

  // ================= Write Operations =================

  /**
   * Protected persistence method - called by base class before event publishing
   */
  protected async persist(goal: Goal): Promise<void> {
    const dto = goal.toServerDTO(true);

    // Run in a transaction for consistency
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
          priority: dto.priority ?? 0,
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
          priority: dto.priority ?? 0,
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

      // 4. Sync Weight Snapshots (insert-only â€?snapshots are immutable)
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
    await this.prisma.goal.delete({ where: { id } });
  }

  // ================= Utility Operations =================

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.goal.count({ where: { id } });
    return count > 0;
  }

  async batchUpdateStatus(ids: string[], status: string): Promise<void> {
    await this.prisma.goal.updateMany({
      where: { id: { in: ids } },
      data: { status, updatedAt: new Date() },
    });
  }

  async batchMoveToFolder(ids: string[], folderId: string | null): Promise<void> {
    await this.prisma.goal.updateMany({
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

      const parent: { parentGoalId: string | null } | null = await this.prisma.goal.findUnique({
        where: { id: currentId },
        select: { parentGoalId: true },
      });
      currentId = parent?.parentGoalId ?? null;
    }
    return false;
  }

  async findChildren(parentId: string): Promise<Goal[]> {
    const rows = await this.prisma.goal.findMany({
      where: { parentGoalId: parentId, deletedAt: null },
      include: GOAL_INCLUDE_ALL,
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((row: PrismaGoalWithRelations) => Goal.load(persistenceDtoToGoalState(PrismaGoalMapper.toDomainDTO(row))));
  }
}
