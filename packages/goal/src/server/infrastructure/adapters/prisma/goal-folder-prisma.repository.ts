import type { PrismaClient, GoalFolder as PrismaGoalFolder } from '@memoflow/database';
import type { IGoalFolderRepository } from '../../../domain';
import { GoalFolder } from '../../../domain';
import { AggregateRepositoryBase, createEventBusAdapter } from '@memoflow/patterns';
import { eventBus } from '@memoflow/utils/domain';
import { PrismaGoalFolderMapper } from './mappers/prisma-goal-folder-mapper';

const eventBusAdapter = createEventBusAdapter(eventBus);

/**
 * GoalFolder Prisma Repository
 *
 * Prisma implementation of IGoalFolderRepository.
 */
export class GoalFolderPrismaRepository
  extends AggregateRepositoryBase<GoalFolder>
  implements IGoalFolderRepository
{
  constructor(private prisma: PrismaClient) {
    super(eventBusAdapter);
  }

  /**
   * Map Prisma row to domain entity
   */
  private mapToEntity(data: PrismaGoalFolder): GoalFolder {
    return PrismaGoalFolderMapper.toDomain(data);
  }

  /**
   * Protected persistence method - called by base class before event publishing
   */
  protected async persist(folder: GoalFolder): Promise<void> {
    const existing = await this.prisma.goalFolder.findUnique({
      where: { id: folder.id as string },
      select: { identityId: true },
    });
    if (existing && existing.identityId !== String(folder.identityId)) {
      throw new Error('Goal folder not found for the current identity.');
    }

    await this.prisma.goalFolder.upsert({
      where: { id: folder.id as string },
      create: {
        id: folder.id as string,
        identityId: folder.identityId as string,
        name: folder.name,
        description: folder.description,
        icon: folder.icon,
        color: folder.color,
        parentFolderId: folder.parentFolderId ? (folder.parentFolderId as string) : null,
        sortOrder: folder.sortOrder,
        folderType: folder.folderType,
        createdAt: new Date(folder.createdAt),
        updatedAt: new Date(folder.updatedAt),
        deletedAt: folder.deletedAt != null ? new Date(folder.deletedAt) : null,
        version: folder.version,
      },
      update: {
        name: folder.name,
        description: folder.description,
        icon: folder.icon,
        color: folder.color,
        parentFolderId: folder.parentFolderId ? (folder.parentFolderId as string) : null,
        sortOrder: folder.sortOrder,
        updatedAt: new Date(folder.updatedAt),
        deletedAt: folder.deletedAt != null ? new Date(folder.deletedAt) : null,
        version: folder.version,
      },
    });
  }

  /**
   * Find folder by identity + ID
   */
  async findByIdForIdentity(identityId: string, id: string): Promise<GoalFolder | null> {
    const data = await this.prisma.goalFolder.findFirst({
      where: { id, identityId },
    });
    return data ? this.mapToEntity(data) : null;
  }

  /**
   * Find all folders by identity ID
   */
  async findByIdentityId(identityId: string): Promise<GoalFolder[]> {
    const data = await this.prisma.goalFolder.findMany({
      where: { identityId, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return data.map((item: PrismaGoalFolder) => this.mapToEntity(item));
  }

  /**
   * Delete folder
   */
  async delete(identityId: string, id: string): Promise<void> {
    const deleted = await this.prisma.goalFolder.deleteMany({
      where: { id, identityId },
    });
    if (deleted.count !== 1) {
      throw new Error('Goal folder not found for the current identity.');
    }
  }

  /**
   * Check if folder exists
   */
  async exists(identityId: string, id: string): Promise<boolean> {
    const count = await this.prisma.goalFolder.count({
      where: { id, identityId },
    });
    return count > 0;
  }
}
