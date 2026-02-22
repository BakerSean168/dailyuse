import type { PrismaClient, GoalFolder as PrismaGoalFolder } from '@dailyuse/database';
import type { IGoalFolderRepository } from '@/domain-server';
import { GoalFolder } from '@/domain-server';
import { AggregateRepositoryBase, createEventBusAdapter } from '@dailyuse/patterns';
import { eventBus } from '@dailyuse/utils';
import { PrismaGoalFolderMapper } from '../../mappers/prisma/prisma-goal-folder-mapper';

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
    const dto = folder.toPersistenceDTO();

    await this.prisma.goalFolder.upsert({
      where: { id: dto.id as string },
      create: {
        id: dto.id as string,
        identityId: dto.identityId as string,
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        color: dto.color,
        parentFolderId: dto.parentFolderId ? (dto.parentFolderId as string) : null,
        sortOrder: dto.sortOrder,
        folderType: dto.folderType,
        goalCount: dto.goalCount,
        completedGoalCount: dto.completedGoalCount,
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
        deletedAt: dto.deletedAt,
        version: dto.version,
      },
      update: {
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        color: dto.color,
        parentFolderId: dto.parentFolderId ? (dto.parentFolderId as string) : null,
        sortOrder: dto.sortOrder,
        goalCount: dto.goalCount,
        completedGoalCount: dto.completedGoalCount,
        updatedAt: dto.updatedAt,
        deletedAt: dto.deletedAt,
        version: dto.version,
      },
    });
  }

  /**
   * Find folder by ID
   */
  async findById(id: string): Promise<GoalFolder | null> {
    const data = await this.prisma.goalFolder.findUnique({
      where: { id },
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
  async delete(id: string): Promise<void> {
    await this.prisma.goalFolder.delete({
      where: { id },
    });
  }

  /**
   * Check if folder exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.goalFolder.count({
      where: { id },
    });
    return count > 0;
  }
}