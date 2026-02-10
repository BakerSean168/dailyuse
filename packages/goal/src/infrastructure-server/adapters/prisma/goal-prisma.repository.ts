/**
 * Goal Prisma Repository
 *
 * Prisma implementation of IGoalRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type { IGoalRepository } from '../../ports/goal-repository.port';

/**
 * Goal Prisma Repository
 *
 * To be extracted from:
 * apps/api/src/modules/goal/infrastructure/repositories/GoalRepository.ts
 */
export class GoalPrismaRepository implements IGoalRepository {
  constructor(private readonly prisma: any) {}

  async findById(uuid: string, options?: { includeChildren?: boolean }): Promise<any | null> {
    return this.prisma.goal.findUnique({
      where: { uuid },
      include: options?.includeChildren
        ? {
            keyResults: true,
            reviews: true,
          }
        : undefined,
    });
  }

  async findByAccountUuid(accountUuid: string, options?: any): Promise<any[]> {
    return this.prisma.goal.findMany({
      where: {
        accountUuid,
        ...(options?.status && { status: options.status }),
        ...(options?.folderUuid && { folderUuid: options.folderUuid }),
      },
      include: options?.includeChildren
        ? {
            keyResults: true,
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByFolderUuid(folderUuid: string): Promise<any[]> {
    return this.prisma.goal.findMany({
      where: { folderUuid },
      orderBy: { createdAt: 'desc' },
    });
  }

  async save(goal: any): Promise<void> {
    // TODO: Extract upsert logic from existing repository
    throw new Error('Not implemented - extract from apps/api');
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.goal.delete({ where: { uuid } });
  }

  async softDelete(uuid: string): Promise<void> {
    await this.prisma.goal.update({
      where: { uuid },
      data: { deletedAt: new Date() },
    });
  }

  async exists(uuid: string): Promise<boolean> {
    const count = await this.prisma.goal.count({ where: { uuid } });
    return count > 0;
  }

  async batchUpdateStatus(uuids: string[], status: string): Promise<void> {
    await this.prisma.goal.updateMany({
      where: { uuid: { in: uuids } },
      data: { status },
    });
  }

  async batchMoveToFolder(uuids: string[], folderUuid: string | null): Promise<void> {
    await this.prisma.goal.updateMany({
      where: { uuid: { in: uuids } },
      data: { folderUuid },
    });
  }
}
