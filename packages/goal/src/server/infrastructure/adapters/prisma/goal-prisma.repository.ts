/**
 * Goal Prisma Repository
 *
 * Prisma implementation of IGoalRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 *
 * Mapping:
 * - Domain Goal → RawGoalData → Prisma result
 * - KeyResult progress is stored as individual columns in Prisma,
 *   mapped through PrismaGoalMapper
 * - GoalReview maps reviewType→type, content→summary, lessonsLearned→improvements
 */

import type { PrismaClient, Prisma } from '@memoflow/database';
import { GoalVersionConflictError, type IGoalRepository } from '../../../domain';
import { Goal } from '../../../domain';
import type { KeyResultServerDTO } from '@memoflow/contracts/goal';
import {
  AggregateRepositoryBase,
  createEventBusAdapter,
  publishAggregateEvents,
  type IEventBus,
} from '@memoflow/patterns';
import { eventBus } from '@memoflow/utils/domain';
import { PrismaGoalMapper, type PrismaGoalWithRelations } from './mappers/prisma-goal-mapper';
import { rawDataToGoalState, type RawKeyResultData } from './mappers/goal-state-mapper';

const eventBusAdapter = createEventBusAdapter(eventBus);

// ============================================================
// Prisma → Domain Mappers (delegated to PrismaGoalMapper)
// ============================================================

/**
 * Parses KeyResult progress into Prisma columns.
 */
function parseKeyResultProgressForPrisma(kr: RawKeyResultData | KeyResultServerDTO) {
  return PrismaGoalMapper.parseKeyResultProgress(kr as RawKeyResultData);
}

// Include preset for Prisma queries
const GOAL_INCLUDE_ALL = {
  keyResults: { orderBy: { order: 'asc' as const } },
  reviews: { orderBy: { createdAt: 'desc' as const } },
  keyResultWeightSnapshots: { orderBy: { snapshotTime: 'desc' as const } },
};

/**
 * Goal Prisma Repository
 */
export class GoalPrismaRepository extends AggregateRepositoryBase<Goal> implements IGoalRepository {
  constructor(
    private readonly prisma: PrismaClient | Prisma.TransactionClient,
    eventBus: IEventBus = eventBusAdapter,
    private readonly transactionBound = false,
  ) {
    super(eventBus);
  }

  // ================= Read Operations =================

  async findByIdForIdentity(
    identityId: string,
    id: string,
    options?: { includeChildren?: boolean },
  ): Promise<Goal | null> {
    const row = await this.prisma.goal.findFirst({
      where: { id, identityId },
      include: options?.includeChildren ? GOAL_INCLUDE_ALL : undefined,
    });
    if (!row) return null;

    const dto = PrismaGoalMapper.toDomainDTO(row);
    return Goal.load(rawDataToGoalState(dto));
  }

  async findByIdentityId(
    identityId: string,
    options?: {
      includeChildren?: boolean;
      status?: string;
      folderId?: string;
      systemView?: 'active' | 'completed' | 'expired' | 'deleted';
    },
  ): Promise<Goal[]> {
    const where: Prisma.GoalWhereInput = {
      identityId,
      ...(options?.status && { status: options.status }),
      ...(options?.folderId && { folderId: options.folderId }),
    };

    switch (options?.systemView) {
      case 'completed':
        where.archivedAt = { not: null };
        where.completedAt = { not: null };
        where.deletedAt = null;
        break;
      case 'expired':
        where.archivedAt = { not: null };
        where.completedAt = null;
        where.deletedAt = null;
        break;
      case 'deleted':
        where.deletedAt = { not: null };
        break;
      case 'active':
      default:
        where.archivedAt = null;
        where.deletedAt = null;
        break;
    }

    // List aggregates are always fully hydrated so counts/progress have one
    // projector (Goal.toClientDTO) instead of persistence-injected overrides.
    const rows = await this.prisma.goal.findMany({
      where,
      include: GOAL_INCLUDE_ALL,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row: PrismaGoalWithRelations) =>
      Goal.load(rawDataToGoalState(PrismaGoalMapper.toDomainDTO(row))),
    );
  }

  async findByKeyResultIdForIdentity(
    identityId: string,
    keyResultId: string,
  ): Promise<Goal | null> {
    const row = await this.prisma.goal.findFirst({
      where: {
        identityId,
        keyResults: { some: { id: keyResultId } },
      },
      include: GOAL_INCLUDE_ALL,
    });
    if (!row) return null;
    return Goal.load(rawDataToGoalState(PrismaGoalMapper.toDomainDTO(row)));
  }

  async findByFolderId(identityId: string, folderId: string): Promise<Goal[]> {
    const rows = await this.prisma.goal.findMany({
      where: { identityId, folderId, deletedAt: null, archivedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row: PrismaGoalWithRelations) =>
      Goal.load(rawDataToGoalState(PrismaGoalMapper.toDomainDTO(row))),
    );
  }

  // ================= Write Operations =================

  /**
   * Protected persistence method - called by base class before event publishing
   */
  protected async persist(goal: Goal): Promise<void> {
    const dto = goal.toServerDTO(true);

    // Run in a transaction for consistency
    const persistInTransaction = async (tx: Prisma.TransactionClient) => {
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
          startDate: dto.startDate ? new Date(dto.startDate) : null,
          targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
          completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
          archivedAt: dto.archivedAt ? new Date(dto.archivedAt) : null,
          folderId: dto.folderId ? (dto.folderId as string) : null,
          parentGoalId: dto.parentGoalId ? (dto.parentGoalId as string) : null,
          sortOrder: dto.sortOrder,
          reminderConfig: dto.reminderConfig ? JSON.stringify(dto.reminderConfig) : null,
          version: dto.version,
          deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
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
          startDate: dto.startDate ? new Date(dto.startDate) : null,
          targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
          completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
          archivedAt: dto.archivedAt ? new Date(dto.archivedAt) : null,
          folderId: dto.folderId ? (dto.folderId as string) : null,
          parentGoalId: dto.parentGoalId ? (dto.parentGoalId as string) : null,
          sortOrder: dto.sortOrder,
          reminderConfig: dto.reminderConfig ? JSON.stringify(dto.reminderConfig) : null,
          version: dto.version,
          deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
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
              identityId: dto.identityId as string,
              title: kr.title,
              description: kr.description,
              valueType: progress.valueType,
              aggregationMethod: progress.aggregationMethod,
              initialValue: progress.initialValue,
              targetValue: progress.targetValue,
              currentValue: progress.currentValue,
              unit: progress.unit,
              weight: kr.weight,
              order: kr.sortOrder,
            },
            update: {
              title: kr.title,
              description: kr.description,
              valueType: progress.valueType,
              aggregationMethod: progress.aggregationMethod,
              initialValue: progress.initialValue,
              targetValue: progress.targetValue,
              currentValue: progress.currentValue,
              unit: progress.unit,
              weight: kr.weight,
              order: kr.sortOrder,
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
              identityId: dto.identityId as string,
              reviewType: review.type,
              title: review.title,
              content: review.summary,
              achievements: review.achievements,
              challenges: review.challenges,
              lessonsLearned: null,
              nextSteps: review.improvements ?? null,
              keyResultSnapshots: review.keyResultSnapshots.length > 0
                ? JSON.stringify(review.keyResultSnapshots)
                : null,
              rating: review.rating,
            },
            update: {
              reviewType: review.type,
              title: review.title,
              content: review.summary,
              achievements: review.achievements,
              challenges: review.challenges,
              lessonsLearned: null,
              nextSteps: review.improvements ?? null,
              keyResultSnapshots: review.keyResultSnapshots.length > 0
                ? JSON.stringify(review.keyResultSnapshots)
                : null,
              rating: review.rating,
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
                identityId: dto.identityId as string,
                keyResultId: ws.keyResultId as string,
                oldWeight: ws.oldWeight,
                newWeight: ws.newWeight,
                weightDelta: ws.weightDelta,
                snapshotTime: new Date(ws.snapshotTime),
                trigger: ws.trigger,
                reason: ws.reason ?? null,
                operatorId: ws.operatorId as string,
              },
            });
          }
        }
      }
    };

    if (this.transactionBound) {
      await persistInTransaction(this.prisma as Prisma.TransactionClient);
      return;
    }

    await (this.prisma as PrismaClient).$transaction(persistInTransaction);
  }

  async saveRootWithExpectedVersion(goal: Goal, expectedVersion: number): Promise<void> {
    if (!this.transactionBound) {
      await (this.prisma as PrismaClient).$transaction(async (tx) => {
        const repository = new GoalPrismaRepository(tx, this.eventBus, true);
        await repository.persistWithExpectedVersion(goal, expectedVersion);
      });
      await publishAggregateEvents(goal, { eventBus: this.eventBus });
      return;
    }

    await this.persistWithExpectedVersion(goal, expectedVersion);
    await publishAggregateEvents(goal, { eventBus: this.eventBus });
  }

  private async persistWithExpectedVersion(goal: Goal, expectedVersion: number): Promise<void> {
    const dto = goal.toServerDTO(false);
    const result = await this.prisma.goal.updateMany({
      where: { id: String(dto.id), identityId: String(dto.identityId), version: expectedVersion },
      data: {
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
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
        folderId: dto.folderId ? String(dto.folderId) : null,
        parentGoalId: dto.parentGoalId ? String(dto.parentGoalId) : null,
        reminderConfig: dto.reminderConfig ? JSON.stringify(dto.reminderConfig) : null,
        version: dto.version,
        updatedAt: new Date(),
      },
    });
    if (result.count !== 1) throw new GoalVersionConflictError();
    await this.persist(goal);
  }

  // ================= Delete Operations =================

  async delete(identityId: string, id: string): Promise<void> {
    const deleted = await this.prisma.goal.deleteMany({
      where: { id, identityId },
    });
    if (deleted.count !== 1) {
      throw new Error('Goal not found for the current identity.');
    }
  }

  async deleteWithExpectedVersion(
    identityId: string,
    id: string,
    expectedVersion: number,
  ): Promise<void> {
    const deleted = await this.prisma.goal.deleteMany({
      where: { id, identityId, version: expectedVersion },
    });
    if (deleted.count !== 1) throw new GoalVersionConflictError();
  }

  // ================= Utility Operations =================

  async exists(identityId: string, id: string): Promise<boolean> {
    const count = await this.prisma.goal.count({ where: { id, identityId } });
    return count > 0;
  }

  async batchUpdateStatus(identityId: string, ids: string[], status: string): Promise<void> {
    if (ids.length === 0) return;
    await this.prisma.goal.updateMany({
      where: { id: { in: ids }, identityId },
      data: { status, updatedAt: new Date() },
    });
  }

  async batchMoveToFolder(
    identityId: string,
    ids: string[],
    folderId: string | null,
  ): Promise<void> {
    if (ids.length === 0) return;
    await this.prisma.goal.updateMany({
      where: { id: { in: ids }, identityId },
      data: { folderId, updatedAt: new Date() },
    });
  }

  // ================= Hierarchy Operations =================

  async isAncestor(
    identityId: string,
    potentialAncestorId: string,
    potentialDescendantId: string,
  ): Promise<boolean> {
    let currentId: string | null = potentialDescendantId;
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === potentialAncestorId) return true;
      if (visited.has(currentId)) break; // Circular reference guard
      visited.add(currentId);

      const parent: { parentGoalId: string | null } | null = await this.prisma.goal.findFirst({
        where: { id: currentId, identityId },
        select: { parentGoalId: true },
      });
      currentId = parent?.parentGoalId ?? null;
    }
    return false;
  }

  async findChildren(identityId: string, parentId: string): Promise<Goal[]> {
    const rows = await this.prisma.goal.findMany({
      where: { parentGoalId: parentId, identityId, deletedAt: null },
      include: GOAL_INCLUDE_ALL,
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((row: PrismaGoalWithRelations) =>
      Goal.load(rawDataToGoalState(PrismaGoalMapper.toDomainDTO(row))),
    );
  }
}
